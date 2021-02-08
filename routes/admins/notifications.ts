import {Router} from "express";
import {sendError, sendResponse} from "../../utils/response";
import {InvitesService} from "../../services/invitesService";
import {reqAsAny} from "../../utils/utils";
import {NotificationService} from "../../services/notificationService";
const app = Router();

const authHandler = require('../middlewares/authenticator')

app.post('/to_token',  authHandler, (req, res, next) => {
    new NotificationService().sendNotificationToToken(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app
