import {Router} from "express";
const app = Router();

app.use(require('../middlewares/userAuthenticator'));

app.use(require('../shared'));

app.use('/deliveries', require('./deliveries'));

module.exports = app;
