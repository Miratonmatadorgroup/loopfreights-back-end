import {Router} from "express";
import {ZoneService} from "../../services/admins/zoneService";
import {sendError, sendResponse} from "../../utils/response";
import {DashboardService} from "../../services/dashboardService";
const app = Router();

app.get('/', (req, res, next) => {
    new DashboardService().loadDashboard().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

module.exports = app;
