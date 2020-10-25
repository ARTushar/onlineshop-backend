const express = require('express');
const categoryRouter = express.Router();
const authenticate = require('../config/authenticate');
const cors = require('./cors');
const Categories = require('../models/category');


categoryRouter.route('')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, (req, res, next) => {
    Categories.find(req.query, 'name subCategory')
      .then(categories => {
        res.status(200).json(categories)
      }, err => next(err))
      .catch(err => next(err))
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.body){
      Categories.create(req.body)
        .then(category => {
          res.status(200).json(category)
        }, err => next(err))
        .catch(err => next(err))
    } else {
      let err = new Error('No category in the request body');
      err.status = 404;
      next(err)
    }
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("PUT operation not supported in /categories");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.remove({})
      .then(resp => {
        res.status(200).json(resp);
      }, err => next(err))
      .catch(err => next(err));
  })

categoryRouter.route('/:categoryId')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findById(req.params.categoryId)
      .then(category => {
        res.status(200).json(category);
      }, err => next(err))
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("POST operation not supported in /categories/" + req.params.categoryId);
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.body){
      Categories.findById(req.params.categoryId)
        .then(category => {
          if(req.body.name){
            category.name = req.body.name;
          }
          if(req.body.subCategory){
            category.subCategory = req.body.subCategory
          }
          category.save()
          .then(category => {
            res.status(200).json(category);
          }, err => next(err))
        }, err => next(err))
        .catch(err => next(err));
    } else {
      let err = new Error("No category found in the request body");
      err.status = 404;
      next(err);
    }
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findByIdAndRemove(req.params.categoryId)
      .then((resp) => {
        res.status(200).json(resp);
      }, (err) => next(err))
      .catch((err) => next(err));
  });

module.exports = categoryRouter;