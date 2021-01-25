import {Router} from "express";
import {PaymentService} from "../../services/external/paymentService";
import {sendError, sendResponse} from "../../utils/response";

const app = Router()

app.post('/verify', (req, res, next) => {
    new PaymentService().verifyPayment(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

module.exports = app