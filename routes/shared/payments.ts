import {Router} from "express";
import {PaymentService} from "../../services/shared/paymentService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
const app = Router();

app.post('/pay', (req, res, next) => {
    new PaymentService().chargeKnownReason(reqAsAny(req).query.userId, reqAsAny(req).query.role, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/submit_pin', (req, res, next) => {
    new PaymentService().submitPin(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/submit_otp', (req, res, next) => {
    new PaymentService().submitOtp(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/submit_phone', (req, res, next) => {
    new PaymentService().submitPhone(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/submit_birthday', (req, res, next) => {
    new PaymentService().submitBirthday(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/submit_address', (req, res, next) => {
    new PaymentService().submitAddress(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/check_status', (req, res, next) => {
    new PaymentService().checkStatus(reqAsAny(req).query.reference).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
