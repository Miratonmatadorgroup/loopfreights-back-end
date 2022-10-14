import {Router} from "express";
const app = Router();

app.use('/auth', require('../shared/auth'));

app.use('/invites', require('./invites'));

app.use(require('../middlewares/authenticator'));

app.use('/dashboard', require('./dashboard'));
app.use('/drivers', require('./drivers'));
app.use('/users', require('./users'));
app.use('/deliveries', require('./deliveries'));
app.use('/notifications', require('./notifications'));
app.use('/promotions', require('./promotions'));
app.use('/platform_configurations', require('./platformConfigurations'));

module.exports = app;
