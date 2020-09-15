import {Router} from "express";
import {sendError, sendResponse} from "../../utils/response";
import {PromotionsService} from "../../services/admins/promotionsService";
import {PlatformConfigurationService} from "../../services/admins/platformConfigurationService";
const app = Router();

app.put('/', (req, res, next) => {
    new PlatformConfigurationService().updatePlatformConfigurations(req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/', (req, res, next) => {
    new PlatformConfigurationService().getPlatformConfiguration().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
