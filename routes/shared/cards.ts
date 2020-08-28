import {Router} from "express";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
import {CardService} from "../../services/shared/cardService";
const app = Router();

app.get('/', (req, res, next) => {
    new CardService().getCards(reqAsAny(req).query.userId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/:id', (req, res, next) => {
    new CardService().getCard(reqAsAny(req).query.userId, req.params.id).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
