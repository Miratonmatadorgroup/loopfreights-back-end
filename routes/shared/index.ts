import {Router} from "express";
const app = Router();

app.use('/wallets', require('./wallets'));
app.use('/payments', require('./payments'));
app.use('/geolocation', require('./geolocation'));
app.use('/notifications', require('./notifications'));
app.use('/transactions', require('./transactions'));

module.exports = app;
