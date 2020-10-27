const express = require('express');
const orderRouter = express.Router();
const Orders = require('../models/orders');
const authenticate = require('../config/authenticate');
const cors = require('./cors');
const { calculateTotalPrice } = require('../lib/utils');


var Pusher = require('pusher');

var pusher = new Pusher({
  appId: '1097690',
  key: '061416dfda86e113a43f',
  secret: 'bd9272ec8e31eaf50766',
  cluster: 'ap2',
  encrypted: true
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
          console.log(orders);
          res.status(200).json(orders)
        }, err => next(err))
        .catch(err => next(err))
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (req.body) {
      if (req.body.status) delete req.body.status;
      if (req.body.parcelAgent) delete req.body.parcelAgent;
      if (req.body.parcelId) delete req.body.parcelId;
      if (req.body.totalCost) delete req.body.totalCost;

      if (req.body._id) delete req.body._id;
      if (req.body.createdAt) delete req.body.createdAt;
      if (req.body.updatedAt) delete req.body.updatedAt;
      req.body.user = req.user._id;
      Orders.create(req.body)
        .then(order => {
          Orders.findById(order._id)
            .populate("products.product", "price discount title images slug")
            .then(order => {
              order.subTotalCost = calculateTotalPrice(order.products);
              order.save()
                .then(order => {
                  res.status(200).json(order);
                  pusher.trigger('admin-channel', 'order-event', {
                    id: order._id,
                    message: 'New order has been posted',
                    time: Date.now()
                  })
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
      .populate('products', 'title slug price discount images')
      .populate('user', 'name')
      .then(order => {
        if (order.user != req.user._id || req.user.admin) {
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
          if (req.body.parcelAgent) {
            order.parcelAgent = req.body.parcelAgent;
          }
          order.save()
            .then(order => {
              res.status(200).json(order);
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
