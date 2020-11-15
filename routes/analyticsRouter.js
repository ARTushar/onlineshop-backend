const express = require('express');
const analyticsRouter = express.Router();
const authenticate = require('../config/authenticate');
const Products = require('../models/products');
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
  })

analyticsRouter.route('/:analyticsId')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Locations.findById(req.params.analyticsId)
      .then(analytics => {
        res.status(200).json(analytics);
      }, err => next(err))
      .catch(err => next(err));
  })


module.exports = analyticsRouter;