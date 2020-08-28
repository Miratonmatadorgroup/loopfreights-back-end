import {Router} from "express";
import {DeliveryService} from "../../services/users/deliveryService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
const app = Router();

app.get('/', (req, res, next) => {
    new DeliveryService().getActiveDeliveries(reqAsAny(req).query.userId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/history', (req, res, next) => {
    new DeliveryService().getPastDeliveries(reqAsAny(req).query.userId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/', (req, res, next) => {
    new DeliveryService().requestDelivery(reqAsAny(req).query.userId, reqAsAny(req).query.role, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/billing', (req, res, next) => {
    new DeliveryService().getBilling(reqAsAny(req).query.userId, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/check_balance', (req, res, next) => {
    new DeliveryService().checkBalance(reqAsAny(req).query.userId, reqAsAny(req).query.role, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/:id', (req, res, next) => {
    new DeliveryService().getDeliveryById(req.params.id).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
