import {Router} from "express";
import {AuthService} from "../../services/auth/authService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
const app = Router();

app.post('/login', (req, res, next) => {
    new AuthService().login(req.body, reqAsAny(req).query.role, reqAsAny(req).query.deviceId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/register', (req, res, next) => {
    new AuthService().register(req.body, reqAsAny(req).query.role, reqAsAny(req).query.deviceId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/verify_email', (req, res, next) => {
    new AuthService().verifyEmail(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/request_reset_password', (req, res, next) => {
    new AuthService().requestPasswordReset(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/reset_password', (req, res, next) => {
    new AuthService().resetPassword(req.body, reqAsAny(req).query.role, reqAsAny(req).query.deviceId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
