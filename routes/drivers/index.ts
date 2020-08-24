import {Router} from "express";
const app = Router();

app.use(require('../middlewares/driverAuthenticator'));

app.use('/deliveries', require('./deliveries'));

module.exports = app;
