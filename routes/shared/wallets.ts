import {Router} from "express";
import {WalletService} from "../../services/shared/walletService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
const app = Router();

app.get('/', (req, res, next) => {
    new WalletService().getWallet(reqAsAny(req).query.userId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/fund', (req, res, next) => {
    new WalletService().fundWallet(reqAsAny(req).query.userId, reqAsAny(req).query.role, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
