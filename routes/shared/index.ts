import {Router} from "express";
import {carriageTypesRoute} from "./carriageTypes";
import {weightClassesRoute} from "./weightClasses";
const app = Router();

app.use('/accounts', require('./accounts'));
app.use('/wallets', require('./wallets'));
app.use('/payments', require('./payments'));
app.use('/cards', require('./cards'));
app.use('/geolocation', require('./geolocation'));
app.use('/notifications', require('./notifications'));
app.use('/transactions', require('./transactions'));
app.use('/earnings', require('./earnings'));
app.use('/banks', require('./banks'));
app.use('/carriage_types', carriageTypesRoute);
app.use('/weight_classes', weightClassesRoute);

module.exports = app;
