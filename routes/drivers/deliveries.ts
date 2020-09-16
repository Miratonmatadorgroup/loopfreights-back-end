import {Router} from "express";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
import { DeliveryService } from "../../services/drivers/deliveryService";
const app = Router();

app.get('/', (req, res, next) => {
    new DeliveryService().getActiveDeliveries(reqAsAny(req).query.userId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/requests', (req, res, next) => {
    new DeliveryService().getDeliveryRequests(reqAsAny(req).query.userId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/accept', (req, res, next) => {
    new DeliveryService().acceptDelivery(reqAsAny(req).query.userId, req.body.deliveryId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/start_pickup', (req, res, next) => {
    new DeliveryService().startPickUp(reqAsAny(req).query.userId, req.body.deliveryId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/arrived', (req, res, next) => {
    new DeliveryService().arrived(reqAsAny(req).query.userId, req.body.deliveryId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/start_drop_off', (req, res, next) => {
    new DeliveryService().startDropOff(reqAsAny(req).query.userId, req.body.deliveryId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/end_drop_off', (req, res, next) => {
    new DeliveryService().endDropOff(reqAsAny(req).query.userId, req.body.deliveryId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/confirm_delivery', (req, res, next) => {
    new DeliveryService().confirmDelivery(reqAsAny(req).query.userId, req.body.deliveryId, req.body).then(result => {
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

app.get('/:id', (req, res, next) => {
    new DeliveryService().getDeliveryById(req.params.id).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/:id/rate', (req, res, next) => {
    new DeliveryService().rate(req.params.id, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
