import {createError, createStatusCodeError} from "../../utils/response";
import {IUser, User} from "../../models/user";
import {verify} from "jsonwebtoken";
import {AuthService} from "../../services/auth/authService";
import {AccountService} from "../../services/shared/accountService";

module.exports = async (req, res, next) => {
    console.log('Authenticating...')
    let token = req.headers['x-access-token'] || req.headers.authorization;
    const deviceId = req.header('deviceId');
    if (!token) return next(createError("Authorization field missing", 401));
    token = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    req.query.deviceId = deviceId;
    req.query.token = token;
    try {
        let user: IUser = await verify(token, process.env.JWT_SECRET) as IUser;
        if (!user) return next(createError('Authorization failed', 401));
        const authToken = await new AuthService().verifyToken(user._id, token, deviceId);
        if (!authToken) return next(createError('Authorization failed', 401));
        user = await new AccountService().getAccount(authToken.userId, false)
        if (!user) return next(createError('Authorization failed', 401));
        req.query.userId = authToken.userId;
        req.query.user = user;
        next();
    } catch (err) {
        next(createStatusCodeError(err, 401));
    }
};
