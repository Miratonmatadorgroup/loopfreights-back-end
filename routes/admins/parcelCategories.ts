import {Router} from "express";
import {sendError, sendResponse} from "../../utils/response";
import {ParcelCategoryService} from "../../services/admins/parcelCategoryService";
const app = Router();

app.post('/', (req, res, next) => {
    new ParcelCategoryService().addParcelCategory(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
