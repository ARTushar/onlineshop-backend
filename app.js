const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const { DATABASE_URL } = require('./config/config');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/userRouter');
const passport = require('passport');
require('./config/authenticate');
const helmet = require('helmet');
const productRouter = require('./routes/productRouter');
// const { cors, corsWithOptions } = require('./routes/cors');


// databse connection
console.log(DATABASE_URL);
const connect = mongoose.connect(DATABASE_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

connect.then((db) => {
    console.log('Connected correctly to the server');
}, (err) => { console.log(err)});

var app = express();


//secure traffic only
// app.all('*', cors, (req, res, next) => {
//     if(req.secure) {
//         return next();
//     } else {
//         res.redirect(307, 'https://' + req.hostname + ":" + app.get('secPort') + req.url);
//     }
// });

app.use(logger('dev'));
app.use(helmet());
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    // if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    //     res.status(400).json({err: 'Bad JSON'});
    // }
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.json(err.message || {err: "Something went wrong"});
})


module.exports = app;
