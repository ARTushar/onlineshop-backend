const express = require('express');
const productRouter = express.Router();
const Products = require('../models/products');
const authenticate = require('../config/authenticate');
const cors = require('./cors');
const Orders = require('../models/orders');
const { json } = require('express');
const Categories = require('../models/category');
const { Storage } = require('@google-cloud/storage');
const { PUSHER_CONFIG, FIREBASE_ADMIN, BUCKET_URL, GCLOUD_APPLICATION_CREDENTIALS } = require('../config/config');

/**
 * pusher configuration
 */
var Pusher = require('pusher');

var pusher = new Pusher({
  appId: PUSHER_CONFIG.appId,
  key: PUSHER_CONFIG.key,
  secret: PUSHER_CONFIG.secret,
  cluster: PUSHER_CONFIG.cluster,
  useTLS: true,
});

const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const memoryStorage = multer.memoryStorage();

const googleCloudStorage = new Storage({
  projectId: FIREBASE_ADMIN.project_id,
  keyFilename: GCLOUD_APPLICATION_CREDENTIALS
})

const bucket = googleCloudStorage.bucket(BUCKET_URL);

const imageFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('You can upload only image files!'), false);
  }

  cb(null, true);
}

const upload = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter
});

const uploadToCloud = (file) => new Promise((resolve, reject) => {
  const blob = bucket.file(file.originalname);
  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: file.mimetype,
    },
  })
  blobStream.on('finish', () => {
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(blob.name)}?alt=media`;
    resolve(publicUrl);
  })
    .on('error', (err) => reject(err))
    .end(file.buffer)
})

const deleteFromCloud = async (publicUrl) => {
  let temp = publicUrl.split('/')
  temp = temp[temp.length-1];
  temp = temp.split('?')[0];
  const fileName = decodeURI(temp);

  await bucket.file(fileName).delete();
}

/*  Handle cors. */

productRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, (req, res, next) => {
      console.log(req.query);
      Products.find(req.query, "title slug price discount images reviews")
        .then((products) => {
          res.status(200).json(products)
        }, err => next(err))
        .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, upload.fields([{
      name: 'images', maxCount: 10
    }, {
      name: 'featuredImages', maxCount: 8
    }]), async (req, res, next) => {
      if (req.body._id) delete req.body._id;
      if (req.body.createdAt) delete req.body.createdAt;
      if (req.body.updatedAt) delete req.body.updatedAt;
      if (req.body.category) delete req.body.category;
      if (req.body.subcategory) delete req.body.subcategory;
      images = []
      for (let i = 0; i < req.files['images'].length; i++) {
        const imageUrl = await uploadToCloud(req.files['images'][i])
        console.log(imageUrl);
        const color = req.files['images'][i].originalname.split('_')[0];
        images.push({
          color: color,
          image: imageUrl
        })
      }
      featuredImages = [];
      for (const featuredImageFile of req.files['featuredImages']) {
        const imageUrl = await uploadToCloud(featuredImageFile)
        console.log(imageUrl)
        featuredImages.push(imageUrl);
      }
      req.body.images = images;
      req.body.featuredImages = featuredImages;
      console.log(JSON.stringify(req.body))

      Products.create(req.body)
        .then((product) => {
          res.status(200).json(product);
        }, (err) => next(err)
        )
        .catch((err) => next(err));
    })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('PUT operation not supported on /products');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.remove({})
      .then((resp) => {
        res.status(200).json(resp);
      }, err => next(err))
      .catch(err => next(err));
  });


productRouter.route('/admin')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.find()
      .populate('reviews.author', 'name')
      .populate('questionAnswers.author', 'name')
      .then((products) => {
        res.status(200).json(products)
      }, err => next(err))
      .catch(err => next(err));
  })
/**
 * home products
 */

productRouter.route('/home')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.corsWithOptions, async (req, res, next) => {

    let homeProducts = {}
    Categories.find({}, 'name')
      .then(async (categories) => {
        for (const cateogry of categories) {
          await Products.find({ categories: cateogry.name }, "title slug price discount images categories reviews")
            .sort({createdAt: -1})
            .limit(parseInt(req.query.limit))
            .then((products) => {
              for (let i = 0; i < products.length; i++) {
                let category = products[i].categories[0];
                if (!homeProducts[category])
                  homeProducts[category] = [];
                homeProducts[category].push(products[i])
              }

            }, err => next(err))
          }
          res.status(200).json(homeProducts)
      }, err => next(err))
  .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('POST operation not supported on /products/home');
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('PUT operation not supported on /products/home');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('DELETE operation not supported on /products/home');
  })


/**
 * 
 */
productRouter.route('/search')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.corsWithOptions, (req, res, next) => {
    console.log(req.query);
    if (req.query && req.query.input) {

      Products.fuzzySearch(req.query.input)
        .then((products) => {
          newProducts = [];
          for (i = 0; i < products.length; i++) {
            newProduct = {};

            if (products[i]._id) newProduct._id = products[i]._id;
            if (products[i].title) newProduct.title = products[i].title;
            if (products[i].price) newProduct.price = products[i].price;
            if (products[i].discount) newProduct.discount = products[i].discount;
            if (products[i].images) newProduct.images = products[i].images;
            if (products[i].slug) newProduct.slug = products[i].slug;
            if (products[i].reviews) newProduct.reviews = products[i].reviews;
            if (products[i]._doc.confidenceScore) newProduct.score = products[i]._doc.confidenceScore;
            newProducts.push(newProduct)
          }
          res.status(200).json(newProducts)
        }, err => next(err))
        .catch(err => next(err));
    } else {
      let err = new Error('No search words in the request body');
      err.status = 404;
      next(err);
    }
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('POST operation not supported on /products/search');
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('PUT operation not supported on /products/search');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('DELETE operation not supported on /products/search');
  })

/**
 * Reviews
 */


productRouter.route('/:productId/reviews')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId, 'reviews')
      .populate('reviews.author', 'name')
      .then((product) => {
        if (product)
          res.status(200).json(product.reviews);
        else {
          let err = new Error('Product ' + req.params.productId + " not found");
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (req.body) {
      let orderId = '';
      if (req.body._id) delete req.body._id;
      if (req.body.createdAt) delete req.body.createdAt;
      if (req.body.updatedAt) delete req.body.updatedAt;
      if (req.body.orderId) {
        orderId = req.body.orderId;
        delete req.body.orderId;
      } else {
        let err = new Error('Order Id is not given in the request body');
        err.status = 404;
        return next(err);
      }
      req.body.author = req.user._id;
      Orders.findById(orderId)
        .then(order => {
          if (order) {
            let found = -1;
            for (let i = 0; i < order.products.length; i++) {
              if (order.products[i].product == req.params.productId) {
                if (order.products[i].reviewGiven && order.products[i].reviewGiven === true) {
                  let err = new Error("Already is reviewed")
                  err.status = 401;
                  return next(err);
                }
                found = i;
                break;
              }
            }
            if (found === -1) {
              let err = new Error("Order product not found!")
              err.status = 404;
              return next(err);
            }
            Products.findById(req.params.productId, 'reviews title sku')
              .then((product) => {
                if (product) {
                  req.body.author = req.user._id;
                  product.reviews.push(req.body)
                  product.save()
                    .then((product) => {
                      console.log(product);
                      Notifications.create({
                        type: 'question',
                        data: {
                          id: product.reviews[product.reviews.length - 1]._id,
                          productId: product.id,
                          productTitle: product.title,
                          productSku: product.sku,
                        }
                      })
                        .then(notificaiton => {
                          console.log(notificaiton);
                          pusher.trigger(PUSHER_CONFIG.channel, PUSHER_CONFIG.reviewEvent, {
                            id: notificaiton._id,
                            reviewId: notificaiton.data.id,
                            productId: notificaiton.data.productId,
                            productTitle: notificaiton.data.productTitle,
                            productSku: notificaiton.data.productSku,
                            createdAt: notificaiton.createdAt
                          });
                        }, err => next(err))
                        .catch(err => next(err))
                    }, (err) => next(err))
                } else {
                  let err = new Error('Product' + req.params.productId + ' not found');
                  err.status = 404;
                  return next(err);
                }
              }, err => next(err))
              .catch(err => next(err))
            order.products[found].reviewGiven = true;
            order.save()
              .then(order => {
                res.status(200).json({ status: 'success', message: 'Successfully posted' });

              })
          } else {
            let err = new Error('Order ' + orderId + ' not found');
            err.status = 404;
            return next(err);
          }
        })

    } else {
      let err = new Error('Review not found in the request body');
      err.status = 404;
      return next(err);
    }
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('PUT operation not supported on /products/' + req.params.productId + "/reviews");
    // if (req.body) {
    //   req.body.author = req.user._id;
    //   Products.updateOne({ _id: req.params.productId, 'reviews.author': { $eq: req.user._id } },
    //     { $set: {"reviews.$.rating": req.body.rating, "reviews.$.description": req.body.description } })
    //     .then((product) => {
    //       Products.findById(req.params.productId, 'reviews')
    //         .populate('reviews.author', 'name')
    //         .then((product) => {
    //           res.status(200).json(product)
    //         }, err => next(err))
    //     }, err => next(err))
    //     .catch(err => next(err))
    // } else {
    //   let err = new Error('Comment not found in the request body');
    //   err.status = 404;
    //   return next(err);
    // }
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    console.log('deleting the reviews');
    Products.findById(req.params.productId, 'reviews')
      .then((product) => {
        if (product) {
          product.reviews = [];
          product.save()
            .then(product => {
              res.status(200).json(product);
            }, err => next(err))
        } else {
          let err = new Error('Product ' + req.params.productId + " not found");
          err.status = 404;
          return next(err);
        }
      }, err => next(err))
      .catch(err => next(err));
  })



productRouter.route('/:productId/reviews/:reviewId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId, 'reviews')
      .populate('reviews.author', 'name')
      .then((product) => {
        if (product && product.reviews.id(req.params.reviewId)) {
          res.status(200).json(product.reviews.id(req.params.reviewId));
        }
        else if (!product) {
          let err = new Error('Product ' + req.params.productId + " not found");
          err.status = 404;
          return next(err);
        } else {
          let err = new Error('Review ' + req.params.reviewId + " not found");
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).end('POST operation not supported on /products/' + req.params.productId + "/reviews/" + req.params.reviewId);
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId, 'reviews')
      .then((product) => {
        if (product && product.reviews.id(req.params.reviewId)) {
          let user_id = product.reviews.id(req.params.reviewId).author;
          if (req.user._id.equals(user_id)) {
            if (req.body.rating) {
              product.reviews.id(req.params.reviewId).rating = req.body.rating;
            }
            if (req.body.description) {
              product.reviews.id(req.params.reviewId).description = req.body.description;
            }
            product.save()
              .then((product) => {
                res.status(200).json(product)
              }, err => next(err))
          } else {
            let err = new Error('You are not authorized to update the review');
            err.status = 403;
            return next(err);
          }
        } else if (!product) {
          let err = new Error('Product ' + req.params.productId + ' not found');
          err.status = 404;
          return next(err);
        } else {
          let err = new Error('Review ' + req.params.reviewId + ' not found');
          err.status = 404;
          return next(err);
        }
      }, err => next(err))
      .catch(err => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId, 'reviews')
      .then((product) => {
        if (product && product.reviews.id(req.params.reviewId)) {
          let user_id = product.reviews.id(req.params.reviewId).author;
          if (req.user._id.equals(user_id)) {
            product.reviews.id(req.params.reviewId).remove();
            product.save()
              .then((product) => {
                res.status(200).json(product);
              }, (err) => next(err));
          } else {
            let err = new Error('You are not authorized to delete the review');
            err.status = 403;
            return next(err);
          }
        }
        else if (!product) {
          err = new Error('Product ' + req.params.productId + ' not found');
          err.status = 404;
          return next(err);
        }
        else {
          err = new Error('Review ' + req.params.reviewId + ' not found');
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })

/**
 * Questions 
 */

productRouter.route('/:productId/questions')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId, 'questionAnswer')
      .populate('questionAnswer.author', 'name')
      .then((product) => {
        if (product)
          res.status(200).json(product.questionAnswers);
        else {
          let err = new Error('Product ' + req.params.productId + " not found");
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (req.body) {
      if (req.body.answer) delete req.body.answer;
      if (req.body._id) delete req.body._id;
      if (req.body.createdAt) delete req.body.createdAt;
      if (req.body.updatedAt) delete req.body.updatedAt;

      Products.findById(req.params.productId, 'questionAnswers title sku')
        .then((product) => {
          if (product) {
            req.body.author = req.user._id;
            product.questionAnswers.push(req.body);
            product.save()
              .then((product) => {
                console.log(product);
                res.status(200).json({ status: 'success', message: 'Successfully posted' });
                Notifications.create({
                  type: 'question',
                  data: {
                    id: product.questionAnswers[product.questionAnswers.length - 1]._id,
                    productId: product.id,
                    productTitle: product.title,
                    productSku: product.sku,
                  }
                })
                  .then(notificaiton => {
                    console.log(notificaiton);
                    pusher.trigger(PUSHER_CONFIG.channel, PUSHER_CONFIG.questionEvent, {
                      id: notificaiton._id,
                      questionId: notificaiton.data.id,
                      productId: notificaiton.data.productId,
                      productTitle: notificaiton.data.productTitle,
                      productSku: notificaiton.data.productSku,
                      createdAt: notificaiton.createdAt
                    });
                  }, err => next(err))
                  .catch(err => next(err))
              }, (err) => next(err))
              .catch(err => next(err))
          } else {
            let err = new Error('Product' + req.params.productId + 'not found');
            err.status = 404;
            return next(err);
          }
        }, err => next(err))
        .catch(err => next(err));
    }
    else {
      let err = new Error('Question not found in the request body');
      err.status = 404;
      return next(err);
    }
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('PUT operation not supported on /products/' + req.params.productId + "/questions");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId, 'questionAnswers')
      .then((product) => {
        if (product) {
          product.questionAnswers = [];
          product.save()
            .then(product => {
              res.status(200).json(product);
            }, err => next(err))
        } else {
          let err = new Error('Product ' + req.params.productId + " not found");
          err.status = 404;
          return next(err);
        }
      }, err => next(err))
      .catch(err => next(err));
  })



productRouter.route('/:productId/questions/:questionId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId, 'questionAnswers')
      .populate('questionAsnwers.author', 'name')
      .then((product) => {
        if (product && product.questionAnswers.id(req.params.questionId)) {
          res.status(200).json(product.questionAnswers.id(req.params.questionId));
        }
        else if (!product) {
          let err = new Error('Product ' + req.params.productId + " not found");
          err.status = 404;
          return next(err);
        } else {
          let err = new Error('Question ' + req.params.questionId + " not found");
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).end('POST operation not supported on /products/' + req.params.productId + "/questions/" + req.params.questionId);
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId, 'questionAnswers')
      .then((product) => {
        if (product && product.questionAnswers.id(req.params.questionId)) {
          let user_id = product.questionAnswers.id(req.params.questionId).author;
          if (req.user._id.equals(user_id)) {
            if (req.body.question) {
              product.questionAnswers.id(req.params.questionId).question = req.body.question;
            }
            product.save()
              .then((product) => {
                res.status(200).json(product)
              }, err => next(err))
          } else {
            let err = new Error('You are not authorized to update the Question');
            err.status = 403;
            return next(err);
          }
        } else if (!product) {
          let err = new Error('Product ' + req.params.productId + ' not found');
          err.status = 404;
          return next(err);
        } else {
          let err = new Error('Question ' + req.params.questionId + ' not found');
          err.status = 404;
          return next(err);
        }
      }, err => next(err))
      .catch(err => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId)
      .populate('questionAnswers')
      .then((product) => {
        if (product && product.questionAnswers.id(req.params.questionId)) {
          let user_id = product.questionAnswers.id(req.params.questionId).author;
          if (req.user._id.equals(user_id)) {
            product.questionAnswers.id(req.params.questionId).remove();
            product.save()
              .then((product) => {
                res.status(200).json(product);
              }, (err) => next(err));
          } else {
            let err = new Error('You are not authorized to delete the question');
            err.status = 403;
            return next(err);
          }
        }
        else if (!product) {
          err = new Error('Product ' + req.params.productId + ' not found');
          err.status = 404;
          return next(err);
        }
        else {
          err = new Error('Question ' + req.params.questionId + ' not found');
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })


/**
 * Answers to Question
 */

productRouter.route('/:productId/questions/:questionId/answer')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId, 'questionAnswers')
      .populate('questionAnswers.author', 'name')
      .then((product) => {
        if (product && product.questionAnswers.id(req.params.questionId)) {
          res.status(200).json(product.questionAnswers.id(req.params.questionId).answer);
        }
        else if (!product) {
          let err = new Error('Product ' + req.params.productId + " not found");
          err.status = 404;
          return next(err);
        } else {
          let err = new Error('Question ' + req.params.questionId + " not found");
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end('POST operation not supported on /products/' + req.params.productId + "/questions/" + req.params.questionId + '/answer');
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId)
      .populate('questionAnswers.author', 'name')
      .then((product) => {
        if (product && product.questionAnswers.id(req.params.questionId)) {
          if (req.body.answer) {
            product.questionAnswers.id(req.params.questionId).answer = req.body.answer;
            product.save()
              .then((product) => {
                res.status(200).json(product);
              }, err => next(err))
          } else {
            let err = new Error('Answer not found in the request body');
            err.status = 404;
            return next(err);
          }
        } else if (!product) {
          let err = new Error('Product ' + req.params.productId + ' not found');
          err.status = 404;
          return next(err);
        } else {
          let err = new Error('Question ' + req.params.questionId + ' not found');
          err.status = 404;
          return next(err);
        }
      }, err => next(err))
      .catch(err => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId, 'questionAnswers')
      .then((product) => {
        if (product && product.questionAnswers.id(req.params.questionId)) {
          product.questionAnswers.id(req.params.questionId).answer.remove();
          product.save()
            .then((product) => {
              res.status(200).json(product);
            }, (err) => next(err));
        }
        else if (!product) {
          err = new Error('Product ' + req.params.productId + ' not found');
          err.status = 404;
          return next(err);
        }
        else {
          err = new Error('Question ' + req.params.questionId + ' not found');
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })


/**
 * product
 */
productRouter.route('/:productId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, (req, res, next) => {
    Products.findById(req.params.productId)
      .populate('reviews.author', 'name')
      .populate('questionAnswers.author', 'name')
      .then((product) => {
        if (product) {
          res.status(200).json(product);
        }
        else {
          let err = new Error('Product ' + req.params.productId + ' not found');
          err.status = 404;
          next(err);
        }
      }, err => next(err))
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      res.status(200).end("POST operation not supported on /products/" + req.params.productId);
    })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    upload.fields([{
      name: 'images', maxCount: 10
    }, {
      name: 'featuredImages', maxCount: 8
    }]), (req, res, next) => {
      if (req.body._id) delete req.body._id;
      if (req.body.createdAt) delete req.body.createdAt;
      if (req.body.updatedAt) delete req.body.updatedAt;
      if (req.body.category) delete req.body.category;
      if (req.body.subcategory) delete req.body.subcategory;

      Products.findById(req.params.productId)
        .populate('reviews.author', 'name')
        .populate('questionAnswers.author', 'name')
        .then(async (product) => {
          if (product) {
            images = []
            if (req.files['images']) {
              for (let i = 0; i < req.files['images'].length; i++) {
                const imageUrl = await uploadToCloud(req.files['images'][i])
                console.log(imageUrl);
                const color = req.files['images'][i].originalname.split('_')[0];
                images.push({
                  color: color,
                  image: imageUrl
                })
              }
            }
            featuredImages = [];
            if (req.files['featuredImages']) {
              for (const featuredImageFile of req.files['featuredImages']) {
                const imageUrl = await uploadToCloud(featuredImageFile)
                console.log(imageUrl)
                featuredImages.push(imageUrl);
              }
            }
            if (req.body.imagesOldKeep) {
              if (typeof req.body.imagesOldKeep === 'string') {
                images.push(JSON.parse(req.body.imagesOldKeep));
              } else {
                req.body.imagesOldKeep.map((image) => {
                  images.push(JSON.parse(image));
                })
              }
              // images.push(...req.body.imagesOldKeep);
            }
            if (req.body.featuredImagesOldKeep) {
              if (typeof (req.body.featuredImagesOldKeep) === "string") {
                featuredImages.push(req.body.featuredImagesOldKeep);
              }
              else featuredImages.push(...req.body.featuredImagesOldKeep);
            }
            if (req.body.imagesOldRemove) {
              for (const oldImages of req.body.imagesOldRemove) {
                deleteFromCloud(oldImages);
              }
            }
            if (req.body.featuredImagesOldRemove) {
              for (const oldFeaturedImages of req.body.featuredImagesOldRemove) {
                deleteFromCloud(oldFeaturedImages);
              }
            }
            if (req.body.imagesOldKeep || req.files['images']) {
              product.images = images;
            }
            if (req.body.featuredImagesOldKeep || req.files['featuredImages']) {
              product.featuredImages = featuredImages;
            }
            if (req.body.title) product.title = req.body.title;
            if (req.body.sku) product.sku = req.body.sku;
            if (req.body.price) product.price = req.body.price;
            if (req.body.categories) product.categories = req.body.categories;
            if (req.body.discount) product.discount = req.body.discount;
            if (req.body.features) product.features = req.body.features;
            if (req.body.specifications) product.specifications = req.body.specifications;

            console.log(JSON.stringify(req.body))
            console.log(JSON.stringify(images))
            console.log(JSON.stringify(featuredImages))
            product.save()
              .then(product => {
                res.status(200).json(product);
              }, err => next(err))
          }
          else {
            let err = new Error('Product ' + req.params.productId + ' not found');
            err.status = 404;
            next(err);
          }
        }, (err) => next(err))
        .catch((err) => next(err));
    })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findByIdAndRemove(req.params.productId)
      .then((resp) => {
        res.status(200).json(resp);
      }, (err) => next(err))
      .catch((err) => next(err));
  });


productRouter.route('/product/:slugValue')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, (req, res, next) => {
    Products.findOne({ slug: req.params.slugValue })
      .populate('reviews.author', 'name')
      .populate('questionAnswers.author', 'name')
      .then((product) => {
        if (product) {
          res.status(200).json(product);
        }
        else {
          let err = new Error('Product ' + req.params.productId + ' not found');
          err.status = 404;
          next(err);
        }
      }, err => next(err))
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      res.status(200).end("POST operation not supported on /products/product" + req.params.slugValue);
    })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      res.status(200).end("PUT operation not supported on /products/product" + req.params.slugValue);
    })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(200).end("DELETE operation not supported on /products/product" + req.params.slugValue);
  });

module.exports = productRouter;