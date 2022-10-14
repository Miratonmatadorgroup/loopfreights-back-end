import {Router} from "express";
import {sendError, sendResponse} from "../../utils/response";
import {WeightClassService} from "../../services/shared/weightClassService";
import {reqAsAny} from "../../utils/utils";

export const weightClassesRoute = Router()

weightClassesRoute.post('/',  (req, res, next) => {
    new WeightClassService().addWeightClass(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

weightClassesRoute.get('/', (req, res, next) => {
    new WeightClassService().getWeightClasses().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

weightClassesRoute.get('/by_weight', (req, res, next) => {
    new WeightClassService().getWeightClassByWeight(reqAsAny(req).query.weight).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})
