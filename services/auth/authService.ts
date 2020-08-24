import {IUser, User} from "../../models/user";
import {createError} from "../../utils/response";
import {PasswordsService} from "../shared/passwordsService";
import {UserRole} from "../../models/enums/userRole";
import {AuthToken, IAuthToken} from "../../models/authToken";
import {sign} from "jsonwebtoken";
import {config} from "../../config/config";
import {EmailVerificationService} from "./emailVerificationService";
import {AuthVerificationReason} from "../../models/enums/authVerificationReason";
import {IEmailVerification} from "../../models/emailVerification";
import {AccountService} from "../shared/accountService";
import {Types} from "mongoose";
import {getUpdateOptions} from "../../utils/utils";

export class AuthService {

    public async login(body: IUser, role: UserRole, deviceId: string): Promise<{user: IUser, token: string}> {
        if (!body.email) throw createError('Email address is required', 400);
        if (!(body as any).password) throw createError('Password is required', 400);
        let user: IUser = await User.findOne({email: body.email}).lean<IUser>().exec();
        if (!user)
            throw createError('Account does not exist', 400);
        if (!await new PasswordsService().checkPassword(user._id, (body as any).password))
            throw createError('Incorrect password', 400);
        const update = Object.assign(AuthService.assignProfile(role, body, user), {$addToSet: {roles: role}});
        user = await User.findByIdAndUpdate(user._id, update, getUpdateOptions()).lean<IUser>().exec();
        const token = await this.addAuthToken(user, role, deviceId);
        return {user, token};
    }

    public async register(body: IUser, role: UserRole, deviceId: string): Promise<{user: IUser, token: string}> {
        if (!body.firstName) throw createError('First name is required', 400);
        if (!body.lastName) throw createError('Last name is required', 400);
        if (!body.email) throw createError('Email address is required', 400);
        if (!body.phone) throw createError('Phone number is required', 400);
        if (!(body as any).password) throw createError('Password is required', 400);
        if (await this.checkEmailExists(body.email))
            throw createError('Email address already in use', 400);
        if (await this.checkPhoneExists(body.phone))
            throw createError('Phone number already in use', 400);
        body.roles = [role];
        let user: IUser = new User(AuthService.assignProfile(role, body));
        await user.validate();
        await new PasswordsService().addPassword(user._id, (body as any).password);
        const token = await this.addAuthToken(user.toObject(), role, deviceId);
        user = await user.save();
        await new EmailVerificationService().requestEmailVerification(user.email, AuthVerificationReason.USER_SIGN_UP);
        return {user, token};
    }

    public async verifyEmail(body: any): Promise<{user: IUser, verificationCode: string}> {
        if (!body.email) throw createError('Email address is required', 400);
        if (!body.reason) throw createError('Verification reason is required', 400);
        if (!body.verificationCode) throw createError('Verification code is required', 400);
        const email = body.email;
        const reason: AuthVerificationReason = body.reason;
        const verificationCode = body.verificationCode;
        let user: IUser = await User.findOne({email}).lean<IUser>().exec();
        if (!user) throw createError('Account not found', 400);
        const emailVerificationService = new EmailVerificationService();
        const emailVerification: IEmailVerification = await emailVerificationService.getEmailVerification(email, reason, verificationCode, true);
        switch (reason) {
            case AuthVerificationReason.USER_SIGN_UP:
                user = await User.findByIdAndUpdate(user._id, {emailVerified: true}, {new: true}).lean<IUser>().exec();
                await emailVerificationService.removeEmailVerification(emailVerification._id);
                break;
            case AuthVerificationReason.USER_PASSWORD_RESET:
                break;
        }
        return {user, verificationCode};
    }

    public async requestPasswordReset(body: any): Promise<{email: string}> {
        if (!body.email) throw createError('Email address is required', 400);
        const email = body.email;
        const user: IUser = await User.findOne({email}).lean<IUser>().exec();
        if (!user)
            throw createError('Account does not exist with us', 400);
        await new EmailVerificationService().requestEmailVerification(user.email, AuthVerificationReason.USER_PASSWORD_RESET);
        return {email};
    }

    public async resetPassword(body, role: UserRole, deviceId: string): Promise<{user: IUser, token: string}> {
        if (!body.email) throw createError('Email address is required', 400);
        if (!body.verificationCode) throw createError('Verification code is required', 400);
        if (!body.password) throw createError('Password is required', 400);
        const email = body.email;
        const reason: AuthVerificationReason = AuthVerificationReason.USER_PASSWORD_RESET;
        const verificationCode = body.verificationCode;
        const emailVerificationService = new EmailVerificationService();
        const emailVerification: IEmailVerification = await emailVerificationService.getEmailVerification(email, reason, verificationCode);
        if (!emailVerification.verified) throw createError('Email not verified', 400);
        const user: IUser = await User.findOne({email}).lean<IUser>().exec();
        if (!user) throw createError('Account not found', 400);
        await new PasswordsService().addPassword(user._id, body.password);
        return await this.login({
            email: email,
            password: body.password
        } as any, role, deviceId);
    }
    // noinspection JSMethodCanBeStatic
    private async addAuthToken(user: IUser, role: UserRole, deviceId: string): Promise<string> {
        const userId: string = user._id;
        const token = AuthService.generateToken(user);
        const authToken: IAuthToken = await AuthToken.findOneAndUpdate({userId, role}, {
            deviceId, token
        }, {runValidators: true, setDefaultsOnInsert: true, upsert: true, new: true}).lean<IAuthToken>().exec();
        return authToken.token;
    }

    // noinspection JSMethodCanBeStatic
    private async removeAllTokensForUser(user: IUser) {
        const userId: string = user._id;
        await AuthToken.deleteMany({userId}).exec();
    }

    public async verifyToken(userId: string, token: string, deviceId: string): Promise<IAuthToken> {
        // console.log(`Verifying token. User: ${userId}, token: ${token}, deviceId: ${deviceId}`);
        return await AuthToken.findOne({userId, deviceId, token}).lean<IAuthToken>().exec();
    }

    public async getAuthToken(token: string, role: UserRole, validate = true): Promise<IAuthToken> {
        const authToken: IAuthToken = await AuthToken.findOne({token, role}).lean<IAuthToken>().exec();
        if (!authToken && validate) throw createError('Auth token not found', 400);
        return authToken;
    }

    // noinspection JSMethodCanBeStatic
    private async checkEmailExists(email: string): Promise<boolean> {
        const count = await User.estimatedDocumentCount({email}).exec();
        return count > 0;
    }

    // noinspection JSMethodCanBeStatic
    private async checkPhoneExists(phone: string): Promise<boolean> {
        const count = await User.estimatedDocumentCount({phone}).exec();
        return count > 0;
    }

    private static generateToken(user: IUser): string {
        return sign(user, config.jwtSecret);
    }

    private static assignProfile(role: UserRole, body: any, existingUser?: IUser): any {
        if (role === UserRole.DRIVER) {
            return Object.assign(body, {
                driverProfile: existingUser?.driverProfile || {
                    _id: Types.ObjectId(),
                    message: 'Document not uploaded',
                    enabled: false,
                    totalRating: 0,
                    averageRating: 5
                }
            });
        } else {
            return  Object.assign(body, {
                userProfile: existingUser?.userProfile || {
                    _id: Types.ObjectId(),
                    message: null,
                    enabled: false,
                    totalRating: 0,
                    averageRating: 5
                }
            });
        }
    }
}
