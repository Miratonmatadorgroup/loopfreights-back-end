import {Router} from "express";
import {sendError, sendResponse} from "../../utils/response";
import {InvitesService} from "../../services/invitesService";
import {reqAsAny} from "../../utils/utils";
const app = Router();

const authHandler = require('../middlewares/authenticator')

app.post('/',  authHandler, (req, res, next) => {
    new InvitesService().inviteAdmin(reqAsAny(req).query.userId, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/accept', (req, res, next) => {
    new InvitesService().verifyInvite(req.body.token).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

module.exports = app
