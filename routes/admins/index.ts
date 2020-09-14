import {Router} from "express";
const app = Router();

app.use('/auth', require('../shared/auth'));

app.use('/invites', require('./invites'));

app.use(require('../middlewares/authenticator'));

app.use('/dashboard', require('./dashboard'));
app.use('/drivers', require('./drivers'));
app.use('/users', require('./users'));
app.use('/deliveries', require('./deliveries'));
app.use('/zones', require('./zones'));
app.use('/promotions', require('./promotions'));
app.use('/parcel_categories', require('./parcelCategories'));

module.exports = app;
