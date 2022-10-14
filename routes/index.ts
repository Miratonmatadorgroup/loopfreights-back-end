const express = require('express');
const app = express.Router();

app.use('/external', require('./external'))

app.use(require('./middlewares/routeGuard'));

app.use('/auth', require('./shared/auth'));

app.use(require('./middlewares/authenticator'));

app.use('/users', require('./users'));
app.use('/drivers', require('./drivers'));
app.use(require('./shared'))

module.exports = app;
