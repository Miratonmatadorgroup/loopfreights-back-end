import {Router} from "express";
const app = Router();

app.use('/zones', require('./zones'));
app.use('/parcel_categories', require('./parcelCategories'));

module.exports = app;
