const express = require('express');
const productRouter = express.Router();
const Products = require('../models/products');
const authenticate = require('../config/authenticate');
const cors = require('./cors');

/*  Handle cors. */

productRouter.route('/')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.find(req.query)
      .then((products) => {
        res.status(200).json(products)
      }, err => next(err))
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    console.log('product posting');
    Products.create(req.body)
      .then((product) => {
        console.log('product created ', product);
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



productRouter.route('/home')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.corsWithOptions, (req, res, next) => {
    Products.find(req.query, "title slug price discount averageRating image")
      .then((products) => {
        res.status(200).json(products)
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



productRouter.route('/:productId/reviews')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId, 'reviews')
      .populate('reviews.author', 'name')
      .then((product) => {
        if(product)
          res.status(200).json(product);
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
      req.body.author = req.user._id;
      Products.updateOne({ _id: req.params.productId, 'reviews.author': { $ne: req.user._id } },
        { $push: { reviews: req.body } }, { upsert: true })
        .then((resp) => {
          Products.findById(req.params.productId, 'reviews')
            .populate('reviews.author', 'name')
            .then((product) => {
              res.status(200).json(product)
            }, err => next(err))
        }, err => next(err))
        .catch(err => next(err))
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
    Products.findById(req.params.productId)
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
            let err = new Error('You are not authorized to update the review');
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



productRouter.route('/:productId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, (req, res, next) => {
    Products.findById(req.params.productId)
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
    (req, res, next) => {
      Products.findByIdAndUpdate(req.params.productId, { $set: req.body }, { new: true })
        .then((product) => {
          if (product) {
            res.status(200).json(product);
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




module.exports = productRouter;