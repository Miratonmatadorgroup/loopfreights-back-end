import {Router} from "express";
import {sendError, sendResponse} from "../../utils/response";
import {ZoneService} from "../../services/shared/zoneService";
import {reqAsAny} from "../../utils/utils";
const app = Router();

app.get('/', (req, res, next) => {
    new ZoneService().getZones().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/', (req, res, next) => {
    new ZoneService().getZoneByLga(reqAsAny(req).query.lga, reqAsAny(req).query.validate).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
