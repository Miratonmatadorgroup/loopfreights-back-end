import {Router} from "express";
import {WalletService} from "../../services/shared/walletService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
import {AccountService} from "../../services/shared/accountService";
const app = Router();


app.post('/', (req, res, next) => {
    new AccountService().editAccount(reqAsAny(req).query.userId, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
