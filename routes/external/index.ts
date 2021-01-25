import {Router} from "express";

const app = Router()

app.use('/payments', require('./payments'))

module.exports = app