import {Router} from "express";
import {upload} from "../../services/shared/uploadService";
import {CarriageTypeService} from "../../services/shared/carriageTypeService";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";

export const carriageTypesRoute = Router()

carriageTypesRoute.post('/', upload.single('file'), (req, res, next) => {
    new CarriageTypeService().addCarriageType(reqAsAny(req).file, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

carriageTypesRoute.get('/', (req, res, next) => {
    new CarriageTypeService().getCarriageTypes().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})
