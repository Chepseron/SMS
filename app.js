var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fileUpload = require('express-fileupload');

var db = require('./models/database');
var sms = require('./models/sms.model');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var smsRouter = require('./routes/sms.route');
var cmd=require('node-cmd'); cmd.run('npm start');

var app = express();

app.use(fileUpload());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/sms', smsRouter);

module.exports = app;
