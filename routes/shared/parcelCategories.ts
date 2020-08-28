import {Router} from "express";
import {sendError, sendResponse} from "../../utils/response";
import {ParcelCategoryService} from "../../services/shared/parcelCategoryService";
const app = Router();

app.get('/', (req, res, next) => {
    new ParcelCategoryService().getParcelCategories().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
