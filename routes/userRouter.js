var express = require('express');
var router = express.Router();
const User = require('../models/users');
const passport = require('passport');
const authenticate = require('../config/authenticate');
const cors = require('./cors');

/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, function (req, res, next) {
    User.find({})
        .then((users) => {
            res.statusCode = 200;
            res.json(users);
        })
        .catch((err) => next(err));
});

router.post('/signup', cors.corsWithOptions, (req, res, next) => {
    User.register(new User({name: req.body.name, mobile: req.body.mobile }), req.body.password, (err, user) => {
        if (err) {
            res.statusCode = 500;
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
    if(req.body.username.indexOf('@') == -1) 
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
            res.statusCode = 200;
            res.json({ success: true, token: token, status: 'Login successfull!' });
        });
    })(req, res, next);
});

router.post('/update', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user._id)
        .then((user) => {
            if (!user){
                var err = new Error('User not found!');
                err.status = 404;
                next(err);
            }
            if(req.body.mobile) user.mobile = req.body.mobile;
            if(req.body.email) user.email = req.body.email;
            if (req.body.name) user.name = req.body.name;
            if (req.body.address) {
                if(req.body.address.country) user.address.country = req.body.address.country;
                if(req.body.address.district) user.address.district = req.body.address.district;
                if(req.body.address.thana) user.address.thana = req.body.address.thana;
                if(req.body.address.region) user.address.region = req.body.address.region;
                if(req.body.address.homeLocation) user.address.homeLocation = req.body.address.homeLocation;
                if(req.body.address.postalCode) user.address.postalCode = req.body.address.postalCode;
            }
            user.save((err, user) => {
                if (err) {
                    res.statusCode = 500;
                    res.json({ err: err });
                    return;
                }
                res.json(user);
            });
        }, err => next(err))
        .catch(err => next(err));
})

router.get('/logout', (req, res, next) => {
    if (req.user) {
        req.logOut()
    } else {
        var err = new Error('You are not logged in!');
        err.status = 403;
        next(err);
    }
});


router.get('/checkJWTtoken', cors.corsWithOptions, (req, res) => {
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
    })(req, res);
});

module.exports = router;
