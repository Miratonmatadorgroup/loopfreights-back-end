import {Router} from "express";
import {WalletService} from "../../services/shared/walletService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
import {AccountService} from "../../services/shared/accountService";
const app = Router();

app.get('/', (req, res, next) => {
    new AccountService().getAccount(reqAsAny(req).query.userId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

app.post('/', (req, res, next) => {
    new AccountService().editAccount(reqAsAny(req).query.userId, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/payment_account', (req, res, next) => {
    new AccountService().updatePaymentAccount(reqAsAny(req).query.userId, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
