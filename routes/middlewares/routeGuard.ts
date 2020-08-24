import {createError} from "../../utils/response";

module.exports = async (req, res, next) => {
    req.query.deviceId = req.header('deviceId');
    req.query.role = req.header('role');
    req.query.appVersion = req.header('app-version');
    if (!req.query.deviceId) return next(createError('Device id is required', 400));
    if (!req.query.role) return next(createError('Role is required', 400));
    if (!req.query.appVersion) return next(createError('App version is required', 400));
    console.log('Normalizing device id: ' + req.query.deviceId + ', role : ' + req.query.role);
    // console.log('Header: ', req.headers);
    next();
};
