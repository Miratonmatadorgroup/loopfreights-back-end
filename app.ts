import {sendResponse, ErrorStatus} from "./utils/response";

const booleanParser = require('express-query-boolean');
import cookieParser from "cookie-parser";
import express from "express";
import logger from "morgan";
import path from "path";

const app = express();
const cors = require('cors');

app.set('trust proxy', 1);

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(booleanParser());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const url = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log('\n::\n:::\n::::');
  console.log(`${ip} calling ${req.method} ${url}`);
  next();
});

app.get('/', (req, res, next) => {
  sendResponse(res, 200, {message: 'Loops Core API V1'});
});

app.use('/v1/admins', require('./routes/admins'));
app.use('/v1', require('./routes'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err: any = new Error("Invalid endpoint");
  err.statusCode = 404;
  err.status = err.status || ErrorStatus.FAILED;
  next(err);
});

// error handler
app.use((err: any, req: any, res: any, next: any) => {
  // set locals, only providing error in development
  const error: any = {};
  error.message = err.message;
  // error.error = req.app.get("env") === "development" ? err : {};
  error.statusCode = err.statusCode ? err.statusCode :  500;
  error.status = err.status || ErrorStatus.FAILED;
  const url = req.protocol + "://" + req.get("host") + req.originalUrl;
  console.error({errorUrl: url, error: err});
  console.log('Sending error \n::::\n:::\n::');
  res.status(error.statusCode);
  res.json(error);
});

module.exports = app;
