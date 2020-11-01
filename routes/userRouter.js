var express = require('express');
var router = express.Router();
const User = require('../models/users');
const passport = require('passport');
const authenticate = require('../config/authenticate');
const cors = require('./cors');
const admin = require('firebase-admin');
const { auth } = require('firebase-admin');

/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

router.get('', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  User.findById(req.user._id, "name mobile email address wishList")
    .populate('wishList', 'images title price discount slug reviews')
    .then(user => {
      res.status(200).json(user);
    }, err => next(err))
    .catch(err => next(err))
})


router.get('/admin', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, function (req, res, next) {
  User.find(req.query)
    .then((users) => {
      res.statusCode = 200;
      res.json(users);
    })
    .catch((err) => next(err));
});

router.post('/register', cors.corsWithOptions, (req, res, next) => {
  User.register(new User({ name: req.body.name, mobile: req.body.mobile }), req.body.password, (err, user) => {
    if (err) {
      res.statusCode = 500;
      console.log(JSON.stringify(err));
      res.json({ err: err });
    } else {
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.json({ err: err });
          return;
        }
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.json({ success: true, status: 'Registration Successfull' });

        });
      });
    }
  });
});

router.post('/login', cors.corsWithOptions, (req, res, next) => {
  console.log(JSON.stringify(req.body));
  if (req.body.username.indexOf('@') == -1)
    req.body.mobile = req.body.username;
  else
    req.body.email = req.body.username;
  delete req.body.username;

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.statusCode = 401;
      res.json({ success: false, status: 'Login unsuccessful!', err: info });
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.json({ success: false, status: 'Login unsuccessful!', err: 'Could not log in user!' });
      }
      let token = authenticate.getToken(req.user);
      const refreshToken = authenticate.getToken(req.user, 'refresh');
      console.log('validated: ' + token);
      res.statusCode = 200;
      res.json({ success: true, token: token, refreshToken, status: 'Login successfull!' });
    });
  })(req, res, next);
});

router.put('/password', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if(!user){
        var err = new Error('User not found!');
        err.status = 404;
        return next(err);
      }
      if(req.body.oldPassword && req.body.newPassword){
        user.changePassword(req.body.oldPassword, req.body.newPassword)
          .then(user => {
            res.status(200).json({status: 'successful'})
          }, err => next(err))
          .catch(err => next(err));

      } else{
        var err = new Error('Password not found in the request body!');
        err.status = 404;
        return next(err);
      }
    }, err => next(err))
    .catch(err => next(err));
})

router.put('/update', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        var err = new Error('User not found!');
        err.status = 404;
        return next(err);
      }
      if (req.body.mobile) user.mobile = req.body.mobile;
      if (req.body.email) user.email = req.body.email;
      if (req.body.name) user.name = req.body.name;
      if (req.body.address) {
        if (req.body.address.country) user.address.country = req.body.address.country;
        if (req.body.address.district) user.address.district = req.body.address.district;
        if (req.body.address.thana) user.address.thana = req.body.address.thana;
        if (req.body.address.region) user.address.region = req.body.address.region;
        if (req.body.address.homeLocation) user.address.homeLocation = req.body.address.homeLocation;
        if (req.body.address.postalCode) user.address.postalCode = req.body.address.postalCode;
      }
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.send(err.message);
          return;
        }
        res.json(user);
      });
    }, err => next(err))
    .catch(err => next(err));
})


router.get('/checkJWTtoken', cors.corsWithOptions, (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT invalid!', success: false, err: info });
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT valid', success: true, user: user });
    }
  })(req, res, next);
});

/**
 * refresh token
 */

router.get('/token/refresh', cors.corsWithOptions, (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.status(401).json({ status: 'JWT invalid!', success: false, err: info });
    } else {
      const token = authenticate.getToken(user);
      const refreshToken = authenticate.getToken(user, 'refresh');
      res.status(200).json({
        success: true,
        token,
        refreshToken,
        status: 'Refresh Successfull'
      });
    }
  })(req, res, next);
});

// router.get('/facebook/token', cors.corsWithOptions, passport.authenticate('facebook-token'), (req, res, next) => {
//     if(req.user){
//         const token = authenticate.getToken(req.user);
//         res.status(200).json({success: true,
//             token,
//             status: 'Login Successfull'
//         });
//     }
// });

/**
 * google authentication using firebase
 */

router.post('/google/token', cors.corsWithOptions, (req, res, next) => {
  if (req.body && req.body.idToken) {
    admin.auth().verifyIdToken(req.body.idToken)
      .then(profile => {
        console.log(JSON.stringify(profile));
        User.findOne({ $or: [{ googleId: profile.uid }, { email: profile.email }] }, (err, user) => {
          if (err) {
            console.log(err);
            return next(err);
          }
          if (!err && user !== null) {
            console.log("user has already an account!");
            const token = authenticate.getToken(user);
            const refreshToken = authenticate.getToken(user, 'refresh');
            res.status(200).json({
              success: true,
              token,
              refreshToken,
              status: 'Login Successfull'
            });
          } else {
            console.log("new user!");
            user = new User({ name: profile.name, email: profile.email });
            user.googleId = profile.uid;
            if (profile.mobilePhone)
              user.mobile = profile.mobile;
            user.save((err, user) => {
              if (err)
                return next(err);
              else {
                const token = authenticate.getToken(user);
                const refreshToken = authenticate.getToken(user, 'refresh');
                res.status(200).json({
                  success: true,
                  token,
                  refreshToken,
                  status: 'Login Successfull'
                });
              }
            });
          }
        });
      }, err => {
        next(err)
      })
      .catch(err => next(err))
  } else {
    let err = new Error("No token id in the request body");
    err.status = 404;
    next(err);
  }
});

/**
 * facebook authentication using firebase
 */
router.post('/facebook/token', cors.corsWithOptions, (req, res, next) => {
  if (req.body && req.body.idToken) {
    admin.auth().verifyIdToken(req.body.idToken)
      .then(profile => {
        console.log(JSON.stringify(profile));
        if (profile.email) {
          User.findOne({ $or: [{ facebookId: profile.uid }, { email: profile.email }] }, (err, user) => {
            if (err) {
              console.log(err);
              return next(err);
            }
            if (!err && user !== null) {
              console.log("user has already an account!");
              const token = authenticate.getToken(user);
              const refreshToken = authenticate.getToken(user, 'refresh');
              res.status(200).json({
                success: true,
                token,
                refreshToken,
                status: 'Login Successfull'
              });
            } else {
              console.log("new user!");
              user = new User({ name: profile.name });
              user.facebookId = profile.uid;
              if (profile.mobilePhone)
                user.mobile = profile.mobile;
              if (profile.email)
                user.email = profile.email

              user.save((err, user) => {
                if (err)
                  return next(err);
                else {
                  const token = authenticate.getToken(user);
                  const refreshToken = authenticate.getToken(user, 'refresh');
                  res.status(200).json({
                    success: true,
                    token,
                    refreshToken,
                    status: 'Login Successfull'
                  });
                }
              });
            }
          });
        } else {
          User.findOne({ facebookId: profile.uid }, (err, user) => {
            if (err) {
              console.log(err);
              return next(err);
            }
            if (!err && user !== null) {
              console.log("user has already an account!");
              console.log(JSON.stringify(user));
              const token = authenticate.getToken(user);
              const refreshToken = authenticate.getToken(user, 'refresh');
              res.status(200).json({
                success: true,
                token,
                refreshToken,
                status: 'Login Successfull'
              });
            } else {
              console.log("new user!");
              user = new User({ name: profile.name });
              user.facebookId = profile.uid;
              if (profile.mobilePhone)
                user.mobile = profile.mobile;

              user.save((err, user) => {
                if (err)
                  return next(err);
                else {
                  const token = authenticate.getToken(user);
                  const refreshToken = authenticate.getToken(user, 'refresh');
                  res.status(200).json({
                    success: true,
                    token,
                    refreshToken,
                    status: 'Login Successfull'
                  });
                }
              });
            }
          });
        }
      }, err => {
        next(err)
      })
      .catch(err => next(err))
  } else {
    let err = new Error("No token id in the request body");
    err.status = 404;
    next(err);
  }
});

/**
 * a user
 */
router.get('/:userId', authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.findById(req.params.userId)
    .then(user => {
      res.status(200).json(user);
    }, err => next(err))
    .catch(err => next(err))
})


/**
 * wishlist
 */

router.route('/wishlist/:productId')
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user._id)
      .then(user => {
        if (!user) {
          var err = new Error('User not found!');
          err.status = 404;
          return next(err);
        }
        if(user.wishList){
          for(const product of user.wishList){
            if(product == req.params.productId){
              let err = new Error('Duplicate product error!');
              err.status = 400;
              return next(err)
            }
          }
          user.wishList.push(req.params.productId);
        } else {
          user.wishList = [req.params.productId];
        }
        user.save()
          .then(product => {
            res.status(200).json({success: true})
          })
      }, err => next(err))
      .catch(err => next(err))
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user._id)
      .then(user => {
        if (!user) {
          var err = new Error('User not found!');
          err.status = 404;
          return next(err);
        }
        let k = -1;
        if (user.wishList) {
          k = user.wishList.indexOf(req.params.productId);
          user.wishList.pull(req.params.productId);
        }
        if(k === -1){
          let error = new Error('product not found!')
          error.status = 404;
          return next(error);
        }
        
        user.save()
          .then(product => {
            res.status(200).json({ success: true })
          })
      }, err => next(err))
      .catch(err => next(err))
  });


module.exports = router;
