const express = require('express');
const voucherRouter = express.Router();
const authenticate = require('../config/authenticate');
const cors = require('./cors');
const Vouchers = require('../models/voucher');


voucherRouter.route('')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Vouchers.find(req.query)
      .then(vouchers => {
        res.status(200).json(vouchers)
      }, err => next(err))
      .catch(err => next(err))
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.body){
      Vouchers.create(req.body)
        .then(voucher => {
          res.status(200).json(voucher)
        }, err => next(err))
        .catch(err => next(err))
    } else {
      let err = new Error('No voucher in the request body');
      err.status = 404;
      next(err)
    }
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("PUT operation not supported in /vouchers");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Vouchers.remove({})
      .then(resp => {
        res.status(200).json(resp);
      }, err => next(err))
      .catch(err => next(err));
  })

voucherRouter.route('/:voucherId')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Vouchers.findById(req.params.voucherId)
      .then(voucher => {
        res.status(200).json(voucher);
      }, err => next(err))
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.status(403).end("POST operation not supported in /vouchers/" + req.params.voucherId);
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.body){
      Vouchers.findById(req.params.voucherId)
        .then(voucher => {
          if(req.body.validity){
            voucher.validity = req.body.validity;
          }
          if(req.body.quantity){
            voucher.quantity = req.body.quantity;
          }
          if(req.body.discount){
              voucher.discount = req.body.discount;
          }
          voucher.save()
          .then(voucher => {
            res.status(200).json(voucher);
          }, err => next(err))
        }, err => next(err))
        .catch(err => next(err));
    } else {
      let err = new Error("No voucher found in the request body");
      err.status = 404;
      next(err);
    }
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Vouchers.findByIdAndRemove(req.params.voucherId)
      .then((resp) => {
        res.status(200).json(resp);
      }, (err) => next(err))
      .catch((err) => next(err));
  });