#!/usr/bin/env node
import {config} from "../config/config";
import {NotificationService} from "../services/shared/notificationService";
import {PlatformConfigurationService} from "../services/admins/platformConfigurationService";

/**
 * Module dependencies.
 */

const app = require('../app');
const debug = require('debug')('loops:server');
const http = require('http');

/**
 * Get port from environment and supplier in Express.
 */

const port = normalizePort(process.env.PORT || '80');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

const WebsocketServer = require('../libs/socketServer');
// tslint:disable-next-line:no-unused-expression
new WebsocketServer.SocketServer(server);

/**
 * Mongoose
 * @type {module:mongoose}
 */
const mongoose = require('mongoose');
/**
 * Listen on provided port, on all network interfaces.
 */

server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  // tslint:disable-next-line:no-shadowed-variable
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

const connectMongoose = () => {
  const options = {
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    useNewUrlParser: true,
    useCreateIndex: true
  };
  const mongoUrl = config.mongoDbUrl;
  console.log('Mongo url: ' + mongoUrl);
  mongoose.connect(mongoUrl, options).then(async () => {
    console.log('Connected to mongo instance');
    server.listen(port);
    PlatformConfigurationService.ensurePlatformConfigurations();
    NotificationService.beginCheckForInvalidTokens();
  }, err => {
    console.error('www error', err);
    process.exit(1);
  });
};

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

connectMongoose();
