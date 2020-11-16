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
    if (req.query.from && req.query.to) {
      Products.countDocuments({ createdAt: { $gte: req.query.from, $lte: req.query.to } })
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if (req.query.from) {
      Products.countDocuments({ createdAt: { $gte: req.query.from } })
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if (req.query.to) {
      Products.countDocuments({ createdAt: { $lte: req.query.to } })
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else {
      Products.countDocuments({})
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    }
  });

analyticsRouter.route('/totalorders')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if (req.query.from && req.query.to) {
      Orders.countDocuments({ createdAt: { $gte: req.query.from, $lte: req.query.to } })
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if (req.query.from) {
      Orders.countDocuments({ createdAt: { $gte: req.query.from } })
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if (req.query.to) {
      Orders.countDocuments({ createdAt: { $lte: req.query.to } })
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else {
      Orders.countDocuments({})
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));

    }
  })

analyticsRouter.route('/lastmonthdata')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    let counts = {};
    let dayTime = 24 * 3600 * 1000;
    let currentTime = Date.now();
    let prevTime = currentTime - 30 * dayTime;
    let orders;
    try {
      orders = await Orders.find({ createdAt: { $gt: prevTime, $lte: currentTime } }, 'createdAt subTotalCost -_id')
    } catch (err) {
      return next(err);
    }
    for (let order of orders) {
      let entry = Math.floor((currentTime - order.createdAt) / dayTime) + 1;
      let entryName = 'entry' + entry;
      if (counts[entryName]) {
        counts[entryName].totalOrders += 1
        counts[entryName].totalSalesValue += order.subTotalCost;
      } else {
        counts[entryName] = {
          date: currentTime - entry * dayTime,
          totalOrders: 1,
          totalSalesValue: order.subTotalCost
        }
      }
    }
    for(let i = 1; i <= 30; i++){
      let entryName = 'entry' + i;
      if(!counts[entryName]){
        counts[entryName] = {
          date: currentTime - i * dayTime,
          totalOrders: 0,
          totalSalesValue: 0
        }
      }

    }
    const ordered = {};
    Object.keys(counts).sort((key1, key2) => {
      if(key1.length < key2.length) return -1;
      if(key1.length > key2.length) return 1;
      else {
        if(key1 < key2) return -1;
        else return 1;
      }
    }).map((key) => ordered[key] = counts[key]);

    res.json(ordered).status(200);
  })


analyticsRouter.route('/totalusers')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if (req.query.from && req.query.to) {
      Users.countDocuments({ createdAt: { $gte: req.query.from, $lte: req.query.to } })
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if (req.query.from) {
      Users.countDocuments({ createdAt: { $gte: req.query.from } })
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if (req.query.to) {
      Users.countDocuments({ createdAt: { $lte: req.query.to } })
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else {
      Users.countDocuments({})
        .then(resp => {
          res.json({ count: resp }).status(200);
        }, err => next(err))
        .catch(err => next(err));

    }
  })

analyticsRouter.route('/totalsalesvalue')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if (req.query.from && req.query.to) {
      Orders.find({ createdAt: { $gte: req.query.from, $lte: req.query.to } }, 'subTotalCost')
        .then(orders => {
          const totalCost = orders.reduce(((accumulator, currentValue) =>
            accumulator + currentValue.subTotalCost
          ), 0);
          res.json({ totalCost }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if (req.query.from) {
      Orders.find({ createdAt: { $gte: req.query.from } }, 'subTotalCost')
        .then(orders => {
          const totalCost = orders.reduce(((accumulator, currentValue) =>
            accumulator + currentValue.subTotalCost
          ), 0);
          res.json({ totalCost }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else if (req.query.to) {
      Orders.find({ createdAt: { $lte: req.query.to } }, 'subTotalCost')
        .then(orders => {
          const totalCost = orders.reduce(((accumulator, currentValue) =>
            accumulator + currentValue.subTotalCost), 0);
          res.json({ totalCost }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    } else {
      Orders.find({})
        .then(orders => {
          const totalCost = orders.reduce(((accumulator, currentValue) =>
            accumulator + currentValue.subTotalCost), 0);
          res.json({ totalCost }).status(200);
        }, err => next(err))
        .catch(err => next(err));
    }
  })

// analyticsRouter.route('/lastmonthsalesvalue')
//   .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
//   .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
//     let counts = {};
//     let currentTime = Date.now();
//     let prevTime = currentTime - (24 * 3600 * 1000);
//     for (let i = 1; i <= 30; i++) {
//       try {
//         let orders = await Orders.find({ createdAt: { $gt: prevTime, $lte: currentTime } }, 'subTotalCost')
//         let totalCost = orders.reduce(((accumulator, currentValue) =>
//           accumulator + currentValue.subTotalCost), 0);
//         counts['entry' + i] = {
//           date: currentTime,
//           value: totalCost
//         }
//       } catch (err) {
//         return next(err);
//       }
//       currentTime = prevTime;
//       prevTime = currentTime - (24 * 60 * 60 * 1000);
//     }
//     res.json(counts).status(200);
//   })

module.exports = analyticsRouter;