import {Router} from "express";
import {reqAsAny} from "../../utils/utils";
import {sendError, sendResponse} from "../../utils/response";
import {GeolocationService} from "../../services/shared/geolocationService";
const app = Router();

app.get('/auto_complete', (req, res, next) => {
    new GeolocationService().autoComplete(reqAsAny(req).query.query).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/place_details', (req, res, next) => {
    new GeolocationService().getPlaceDetails(reqAsAny(req).query.placeId).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/reverse_geocode', (req, res, next) => {
    new GeolocationService().reverseGeoCode(reqAsAny(req).query.latitude, reqAsAny(req).query.longitude).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
