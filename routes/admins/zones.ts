import {Router} from "express";
import {ZoneService} from "../../services/admins/zoneService";
import {sendError, sendResponse} from "../../utils/response";
const app = Router();

app.post('/', (req, res, next) => {
    new ZoneService().addZone(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/', (req, res, next) => {
    new ZoneService().getZones().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
