const express = require('express');
const orderRouter = express.Router();
const Orders = require('../models/orders');
const authenticate = require('../config/authenticate');
const cors = require('./cors');
const { calculateTotalPrice } = require('../lib/utils');
const {PUSHER_CONFIG, DEFAULT_USER_ID} = require('../config/config');


var Pusher = require('pusher');
const Locations = require('../models/locations');
const Notifications = require('../models/notifications');
const passport = require('passport');

var pusher = new Pusher({
  appId: PUSHER_CONFIG.appId,
  key: PUSHER_CONFIG.key,
  secret: PUSHER_CONFIG.secret,
  cluster: PUSHER_CONFIG.cluster,
  useTLS: true
});

// pusher.trigger('my-channel', 'my-event', {
//   'message': 'hello mara'
// });


orderRouter.route('/admin')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Orders.find(req.query)
      .populate('user', 'name')
      .populate('products.product', 'images slug price title discount')
      .then((orders) => {
        res.status(200).json(orders)
      }, err => next(err))
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("POST operation not supported on /orders");
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("PUT operation not supported on /orders");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("DELETE operation not supported on /orders");
  })


/**
 * order of an user
 */

orderRouter.route('/user')
  .options(cors.corsWithOptions, (req, res) => {res.sendStatus(200)})
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
      Orders.find({ user: req.user._id })
        .populate({
          path: "products.product",
          select: 'title slug price discount images'
        })
        .then(orders => {
          // console.log(orders);
          res.status(200).json(orders)
        }, err => next(err))
        .catch(err => next(err))
  })
  .post(cors.corsWithOptions, async (req, res, next) => {
    await passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if(err) {
        return next(err);
      } 
      if(!user) {
        req.body.user = DEFAULT_USER_ID;
      } else {
        req.body.user = user._id;
      }
    })(req, res, next);
    
    if (req.body) {
      if (req.body.status) delete req.body.status;
      if (req.body.parcelAgent) delete req.body.parcelAgent;
      if (req.body.parcelId) delete req.body.parcelId;
      if (req.body.totalCost) delete req.body.totalCost;

      if (req.body._id) delete req.body._id;
      if (req.body.createdAt) delete req.body.createdAt;
      if (req.body.updatedAt) delete req.body.updatedAt;
      if (req.body.deliveryCost) delete req.body.deliveryCost;

      try {
        const deliveryCost = await Locations.find({ name: req.body.shippingAddress.district }, 'deliveryCost').exec();
        req.body.deliveryCost = deliveryCost[0].deliveryCost;

      } catch (err) {
        return next(err);
      }

      Orders.create(req.body)
        .then(order => {
          Orders.findById(order._id)
            .populate("products.product", "price discount title images slug")
            .then(order => {
              order.subTotalCost = calculateTotalPrice(order.products);
              order.save()
                .then(order => {
                  res.status(200).json(order);
                  // console.log('ordered ');
                  Notifications.create({
                    type: 'order',
                    data: {
                      id: order._id,
                      subTotalCost: order.subTotalCost,
                      deliveryLocation: order.shippingAddress.district,
                    }
                  })
                    .then(notificaiton => {
                      // console.log(notificaiton);
                      pusher.trigger(PUSHER_CONFIG.channel, PUSHER_CONFIG.orderEvent, {
                        id: notificaiton._id,
                        orderId: notificaiton.data.id,
                        subTotalCost: notificaiton.data.subTotalCost,
                        deliveryLocation: notificaiton.data.deliveryLocation,
                        createdAt: notificaiton.createdAt
                      })
                    }, err => next(err))
                    .catch(err => next(err))
                }, err => next(err))
            }, err => next(err))
        }, err => next(err))
        .catch(err => next(err));
    } else {
      let err = new Error("Order not found in the request body");
      err.status = 404;
      next(err);
    }
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).end("PUT operation not supported on /orders/user");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).end("DELETE operation not supported on /orders/user");
  })


/**
 * 
 */
orderRouter.route('/:orderId')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Orders.findById(req.params.orderId)
      .populate('products.product', 'title slug price discount images')
      .populate('user', 'name')
      .then(order => {
        if (order.user != req.user._id && !req.user.admin) {
          let err = new Error("You are not authorized to view this");
          err.status = 403;
          return next(err);
        } else {
          res.status(200).json(order)
        }
      }, err => next(err))
      .catch(err => next(err))
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("POST operation not supported on /orders/" + req.params.orderId);
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if (req.body) {
      Orders.findById(req.params.orderId)
        .then(order => {
          if (req.body.status) {
            order.status = req.body.status;
          }
          if (req.body.parcelId) {
            order.parcelId = req.body.parcelId;
          }
          if (req.body.deliveryAgent) {
            order.deliveryAgent = req.body.deliveryAgent;
          }
          order.save()
            .then(order => {
              Orders.findById(order._id)
                .populate('products.product', 'title slug price discount images')
                .populate('user', 'name')
                .then(order => {
                  res.status(200).json(order)
                }, err => next(err))
                .catch(err => next(err))
            }, err => next(err))
        }, err => next(err))
        .catch(err => next(err));
    } else {
      let err = new Error("No order field found in the request body")
      err.status = 404;
      next(err);
    }
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("DELETE operation not supported on /orders/" + req.params.orderId);
  })


module.exports = orderRouter;
