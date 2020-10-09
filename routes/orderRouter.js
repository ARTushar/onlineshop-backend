const express = require('express');
const orderRouter = express.Router();
const Orders = require('../models/orders');
const authenticate = require('../config/authenticate');
const cors = require('./cors');
const { calculateTotalPrice } = require('../lib/utils');


orderRouter.route('/admin')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Orders.find(req.query)
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
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
      Orders.find({ author: req.params.userId })
        .populate('products', 'title slug price discount averageRating image')
        .then(orders => {
          res.status(200).json(orders)
        }, err => next(err))
        .catch(err => next(err))
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
      if (req.json) {
        if (req.body.status) delete req.body.status;
        if (req.body.parcelAgent) delete req.body.parcelAgent;
        if (req.body.parcelId) delete req.body.parcelId;
        if (req.body.totalCost) delete req.body.totalCost;

        if (req.body._id) delete req.body._id;
        if (req.body.createdAt) delete req.body.createdAt;
        if (req.body.updatedAt) delete req.body.updatedAt;
        req.body.user = req.user._id;
        Orders.create(req.json)
          .populate("products", "price discount")
          .then(order => {
            order.totalCost = calculateTotalPrice(order.products);
            order.save()
              .then(order => {
                res.status(200).json(order)
              }, err => next(err))
          }, err => next(err))
          .catch(err => next(err))
      } else {
        let error = new Error("Order not found in the request body");
        error.status = 404;
        next(err);
      }
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).end("PUT operation not supported on /orders/" + req.params.userId);
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).end("DELETE operation not supported on /orders/" + req.params.userId);
  })


/**
 * 
 */
// orderRouter.route('/:orderId')