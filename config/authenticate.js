const passport = require('passport');
const crypto = require('crypto'); 

const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const fs = require('fs');
const path = require('path');
const User = require('../models/users');
const jwt = require('jsonwebtoken');

const pathToPublicKey = path.join(__dirname, 'rsa_public.pem');
const PUBLIC_KEY = fs.readFileSync(pathToPublicKey, 'utf-8');
const pathToPrivateKey = path.join(__dirname, 'rsa_private.pem');
const PRIVATE_KEY = fs.readFileSync(pathToPrivateKey,'utf-8');

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUBLIC_KEY,
    algorithms: ['RS256']
}

exports.getToken = (user) => {
    const _id = user._id;
    const expiresIn = '1d';

    const payload = {
        _id,
        iat: Date.now()
    };
    const signedToken = jwt.sign(payload, PRIVATE_KEY, { expiresIn: expiresIn, algorithm: 'RS256'})
    return signedToken;
}

exports.jwtPassport = passport.use(new JwtStrategy(options, (jwt_payload, done) => {
    console.log('JWT payload: ', jwt_payload);
    User.findOne({_id: jwt_payload._id}, (err, user) => {
        if(err) {
            return done(err, false);
        } else if(user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
}));

exports.verifyUser = passport.authenticate('jwt', {session: false});

exports.verifyAdmin = (req, res, next) => {
    if(req.user.admin) {
        next();
    } else {
        let err = new Error('You are not authorized to perform this operation!');
        err.status = 403;
        return next(err);
    }
}