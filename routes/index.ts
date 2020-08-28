const express = require('express');
const app = express.Router();

app.use(require('./middlewares/routeGuard'));

app.use('/auth', require('./shared/auth'));

app.use(require('./middlewares/authenticator'));

app.use('/users', require('./users'));
app.use('/drivers', require('./drivers'));
app.use('/admins', require('./admins'));

module.exports = app;
