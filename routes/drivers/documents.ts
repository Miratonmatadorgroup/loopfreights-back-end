import {Router} from "express";
import {DriverDocumentService} from "../../services/drivers/driverDocumentService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
import {upload} from "../../services/shared/uploadService";
const app = Router();

app.get('/', (req, res, next) => {
    new DriverDocumentService().getDocuments(reqAsAny(req).query.userId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.post('/',  upload.single('file'), (req, res, next) => {
    new DriverDocumentService().addDocument(reqAsAny(req).query.userId, reqAsAny(req).file, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
