const express = require('express');
const analyticsRouter = express.Router();
const authenticate = require('../config/authenticate');
const Orders = require('../models/orders');
const Products = require('../models/products');
const Users = require('../models/users');
const cors = require('./cors');


analyticsRouter.route('/totalproducts')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.query.from && req.query.to){
      Products.countDocuments({createdAt: {$gte: req.query.from, $lte: req.query.to}})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if(req.query.from){
      Products.countDocuments({createdAt: {$gte: req.query.from}})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if(req.query.to){
      Products.countDocuments({createdAt: {$lte: req.query.to}})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else {
      Products.countDocuments({})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
      
    }
  });

analyticsRouter.route('/totalorders')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.query.from && req.query.to){
      Orders.countDocuments({createdAt: {$gte: req.query.from, $lte: req.query.to}})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if(req.query.from){
      Orders.countDocuments({createdAt: {$gte: req.query.from}})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if(req.query.to){
      Orders.countDocuments({createdAt: {$lte: req.query.to}})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else {
      Orders.countDocuments({})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
      
    }
  })

analyticsRouter.route('/totalusers')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.query.from && req.query.to){
      Users.countDocuments({createdAt: {$gte: req.query.from, $lte: req.query.to}})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if(req.query.from){
      Users.countDocuments({createdAt: {$gte: req.query.from}})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if(req.query.to){
      Users.countDocuments({createdAt: {$lte: req.query.to}})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else {
      Users.countDocuments({})
        .then(resp => {
          res.json({count: resp}).status(200);
        }, err => next(err))
        .catch(err => next(err));
      
    }
  })

analyticsRouter.route('/totalsalesvalue')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.query.from && req.query.to){
      Orders.find({createdAt: {$gte: req.query.from, $lte: req.query.to}}, 'subTotalCost')
        .then(orders => {
          const totalCost = orders.reduce(((accumulator, currentValue) => 
            accumulator + currentValue.subTotalCost
            ), 0);
          res.json({totalCost}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if(req.query.from){
      Orders.find({createdAt: {$gte: req.query.from}}, 'subTotalCost')
        .then(orders => {
          const totalCost = orders.reduce(((accumulator, currentValue) => 
            accumulator + currentValue.subTotalCost
            ), 0);
          res.json({totalCost}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if(req.query.to){
      Orders.find({createdAt: {$lte: req.query.to}}, 'subTotalCost')
        .then(orders => {
          const totalCost = orders.reduce(((accumulator, currentValue) => 
            accumulator + currentValue.subTotalCost), 0);
          res.json({totalCost}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else {
      Orders.find({})
        .then(orders => {
          const totalCost = orders.reduce(((accumulator, currentValue) => accumulator + currentValue.subTotalCost), 0);
          res.json({totalCost}).status(200);
        }, err => next(err))
        .catch(err => next(err));
    }
  })


module.exports = analyticsRouter;