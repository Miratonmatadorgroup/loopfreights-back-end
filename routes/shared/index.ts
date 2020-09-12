import {Router} from "express";
const app = Router();

app.use('/accounts', require('./accounts'));
app.use('/wallets', require('./wallets'));
app.use('/payments', require('./payments'));
app.use('/cards', require('./cards'));
app.use('/geolocation', require('./geolocation'));
app.use('/notifications', require('./notifications'));
app.use('/transactions', require('./transactions'));
app.use('/zones', require('./zones'));
app.use('/parcel_categories', require('./parcelCategories'));
app.use('/earnings', require('./earnings'));

module.exports = app;
