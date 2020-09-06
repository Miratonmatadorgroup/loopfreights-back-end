import {IUser, User} from "../models/user";
import {createError} from "../utils/response";
import {EmailService} from "./shared/emailService";
import {EmailTemplateId} from "../models/interfaces/emailTemplatePayload";
import {AdminInvite, IAdminInvite} from "../models/adminInvite";
import moment from "moment";
import {config} from "../config/config";
import {getUpdateOptions} from "../utils/utils";
import {charset, generate} from "voucher-code-generator";
import {UserRole} from "../models/enums/userRole";

export class InvitesService {

    public async inviteAdmin(userId: string, body): Promise<IUser> {
        const email: string = body.email;
        if (!email) throw createError('Email is required', 400);
        const invitee: IUser = await User.findById(userId).lean<IUser>().exec();
        const user: IUser = await User.findOne({email}).lean<IUser>().exec();
        if (!user) throw createError(`User with email ${email} is not a LoopFreights user`, 404);

        const expiresIn: any = moment().add(60, 'minutes');
        const token: string = generate({length: 16, charset: charset("alphanumeric"), count: 1})[0].toUpperCase()
        await AdminInvite.findOneAndUpdate({email}, {
            email: email,
            invitee: invitee._id,
            expiresIn: expiresIn,
            token: token
        }, getUpdateOptions()).exec()
        const inviteLink = `${config.loopsAdminUrl}/invites/accept?token=${token}`
        new EmailService().sendEmail(
            user.email,
            `You have been invited`,
            `${invitee.firstName} has invited you to be an admin`,
            {
                templateId: EmailTemplateId.ADMIN_INVITE,
                data: [
                    {
                        key: 'name',
                        value: user.firstName
                    },
                    {
                        key: 'invitee',
                        value: invitee.firstName
                    },
                    {
                        key: 'invite_link',
                        value: inviteLink
                    }
                ]
            }
        )
        return user;
    }

    public async verifyInvite(token: string): Promise<IAdminInvite> {
        if (!token) throw createError('Token is required', 400);
        let adminInvite: IAdminInvite = await AdminInvite.findOne({token})
            .lean<IAdminInvite>()
            .exec()
        if (!adminInvite) throw createError('Invite not found', 400);
        const currentTime = moment();
        const expiresIn = moment(adminInvite.expiresIn);
        if (currentTime.isAfter(expiresIn))
            throw createError('Invite has expired. Please request another one', 400);
        adminInvite = await AdminInvite.findByIdAndDelete(adminInvite._id).lean<IAdminInvite>().exec();
        await User.findOneAndUpdate({email: adminInvite.email}, {$addToSet: {roles: UserRole.ADMIN}}).exec();
        return adminInvite;
    }

}
