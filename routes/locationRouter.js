const express = require('express');
const locationRouter = express.Router();
const authenticate = require('../config/authenticate');
const cors = require('./cors');
const Locations = require('../models/locations');


locationRouter.route('')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, (req, res, next) => {
    Locations.find({}, 'name banglaName deliveryCost')
      .then(locations => {
        res.status(200).json(locations)
      }, err => next(err))
      .catch(err => next(err))
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.body){
      Locations.create(req.body)
        .then(location => {
          res.status(200).json(location)
        }, err => next(err))
        .catch(err => next(err))
    } else {
      let err = new Error('No location in the request body');
      err.status = 404;
      next(err)
    }
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("PUT operation not supported in /locations");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Locations.remove({})
      .then(resp => {
        res.status(200).json(resp);
      }, err => next(err))
      .catch(err => next(err));
  })

locationRouter.route('/:locationId')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Locations.findById(req.params.locationId)
      .then(location => {
        res.status(200).json(location);
      }, err => next(err))
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("POST operation not supported in /locations/" + req.params.locationId);
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.body){
      Locations.findById(req.params.locationId)
        .then(location => {
          if(req.body.name){
            location.name = req.body.name;
          }
          if(req.body.banglaName){
            location.banglaName = req.body.banglaName;
          }
          if(req.body.deliveryCost){
              location.deliveryCost = req.body.deliveryCost;
          }
          location.save()
          .then(location => {
            res.status(200).json(location);
          }, err => next(err))
        }, err => next(err))
        .catch(err => next(err));
    } else {
      let err = new Error("No location found in the request body");
      err.status = 404;
      next(err);
    }
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Locations.findByIdAndRemove(req.params.locationId)
      .then((resp) => {
        res.status(200).json(resp);
      }, (err) => next(err))
      .catch((err) => next(err));
  });


module.exports = locationRouter;