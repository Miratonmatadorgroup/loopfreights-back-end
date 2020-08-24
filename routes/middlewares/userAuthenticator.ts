import {createError, createStatusCodeError} from "../../utils/response";
import {IUser} from "../../models/user";
import {verify} from "jsonwebtoken";
import {AuthService} from "../../services/auth/authService";
import {UserRole} from "../../models/enums/userRole";

module.exports = async (req, res, next) => {
    const user: IUser = req.query.user;
    if (!user.roles.includes(UserRole.BASIC)) return next(createError('Not authorized to access this resource', 400));
    next();
};
