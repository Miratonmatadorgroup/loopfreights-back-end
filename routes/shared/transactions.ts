import {Router} from "express";
import {TransactionService} from "../../services/shared/transactionService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
const app = Router();

app.get('/', (req, res, next) => {
    new TransactionService().getTransactions(reqAsAny(req).query.type, reqAsAny(req).query.paymentType).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/:id', (req, res, next) => {
    new TransactionService().getTransaction(req.params.id).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
