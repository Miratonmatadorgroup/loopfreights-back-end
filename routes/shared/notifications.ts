import {Router} from "express";
import {NotificationService} from "../../services/shared/notificationService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
const app = Router();

app.get('/', (req, res, next) => {
    new NotificationService().getNotifications(reqAsAny(req).query.userId, reqAsAny(req).query.role).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/fcmToken', (req, res, next) => {
    new NotificationService().saveFcmToken(reqAsAny(req).query.userId, reqAsAny(req).query.role, req.body.fcmToken).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
