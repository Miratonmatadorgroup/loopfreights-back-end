import {Router} from "express";
import {sendError, sendResponse} from "../../utils/response";
import {PromotionsService} from "../../services/admins/promotionsService";
const app = Router();

app.post('/', (req, res, next) => {
    new PromotionsService().createPromotion(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/', (req, res, next) => {
    new PromotionsService().getPromotions().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
