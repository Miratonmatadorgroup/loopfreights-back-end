import {Router} from "express";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
import {EarningService} from "../../services/shared/earningService";
const app = Router();

app.get('/', (req, res, next) => {
    new EarningService().getEarnings(reqAsAny(req).query.userId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/by_day', (req, res, next) => {
    new EarningService().getEarningsByDay(reqAsAny(req).query.userId, reqAsAny(req).query.role).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/summary', (req, res, next) => {
    new EarningService().getEarningsSummary(reqAsAny(req).query.userId, reqAsAny(req).query.role).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
