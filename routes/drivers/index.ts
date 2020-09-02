import {Router} from "express";
const app = Router();

app.use(require('../middlewares/driverAuthenticator'));

app.use(require('../shared'));

app.use('/home', require('./home'));
app.use('/documents', require('./documents'));
app.use('/deliveries', require('./deliveries'));

module.exports = app;
