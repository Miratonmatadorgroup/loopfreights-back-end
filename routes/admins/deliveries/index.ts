import {Router} from "express";
import {sendError, sendResponse} from "../../../utils/response";
import {DeliveriesService} from "../../../services/admins/deliveries/deliveriesService";
const app = Router();

app.get('/', (req, res, next) => {
    new DeliveriesService().getDeliveries().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

app.get('/:id', (req, res, next) => {
    new DeliveriesService().getDelivery(req.params.id).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})


module.exports = app
