import {Router} from "express";
import {sendError, sendResponse} from "../../utils/response";
import {BankService} from "../../services/shared/bankService";
import {reqAsAny} from "../../utils/utils";
const app = Router();

app.get('/', (req, res, next) => {
    new BankService().listBanks().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/resolve', (req, res, next) => {
    new BankService().resolveAccountNumber(reqAsAny(req).query.accountNumber).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
