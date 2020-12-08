import {EmailVerification, IEmailVerification} from "../../models/emailVerification";
import {AuthVerificationReason} from "../../models/enums/authVerificationReason";
import moment from "moment";
import {generate} from "voucher-code-generator";
import {getUpdateOptions} from "../../utils/utils";
import {createError} from "../../utils/response";
import {EmailService} from "../shared/emailService";
import {EmailTemplateId} from "../../models/interfaces/emailTemplatePayload";
import {SmsService} from "../shared/smsService";

export class EmailVerificationService {

    public async requestEmailVerification(email: string, reason: AuthVerificationReason, phone: string = null): Promise<IEmailVerification> {
        let emailVerification: IEmailVerification = await this.getPreviousVerificationIfValid(email, reason);
        if (!emailVerification) {
            const expiresIn: any = moment().add(60, 'minutes');
            const code: string = generate({charset: '1234567890', length: 4})[0];
            emailVerification = await EmailVerification.findOneAndUpdate({email, reason}, {
                code, expiresIn
            }, getUpdateOptions()).lean<IEmailVerification>().exec();
        }
        let templateId: EmailTemplateId;
        switch (reason) {
            case AuthVerificationReason.USER_SIGN_UP:
                templateId = EmailTemplateId.EMAIL_VERIFICATION
                break;
            case AuthVerificationReason.USER_PASSWORD_RESET:
                templateId = EmailTemplateId.PASSWORD_RESET
                break;
        }
        const text = `Please use code '${emailVerification.code}' to verify your account on LoopFreights`
        new EmailService().sendEmail(
            email,
            'Email verification',
            text,
            {
                templateId: templateId,
                data: [
                    {
                        key: 'verification_code',
                        value: emailVerification.code
                    }
                ]
            }
        );
        if (phone != null) {
            new SmsService().sendSms(phone, text);
        }
        return emailVerification;
    }

    public async getEmailVerification(email: string, reason: AuthVerificationReason, code: string, verify = false): Promise<IEmailVerification> {
        let emailVerification: IEmailVerification = await EmailVerification.findOne({email, reason}).lean<IEmailVerification>().exec();
        if (!emailVerification) throw createError('Verification not requested', 400);
        const currentTime = moment();
        const expiresIn = moment(emailVerification.expiresIn);
        if (currentTime.isAfter(expiresIn))
            throw createError('Verification has expired. Please request another one', 400);
        if (code !== emailVerification.code) throw createError('Incorrect code', 400);
        const updatePayload = verify ? {verified: true} : {};
        emailVerification = await EmailVerification.findByIdAndUpdate(emailVerification._id, updatePayload).lean<IEmailVerification>().exec();
        return emailVerification;
    }

    public async removeEmailVerification(id: string): Promise<IEmailVerification> {
        return await EmailVerification.findByIdAndDelete(id).lean<IEmailVerification>().exec();
    }

    // noinspection JSMethodCanBeStatic
    private async getPreviousVerificationIfValid(email: string, reason: AuthVerificationReason): Promise<IEmailVerification | null> {
        const emailVerification: IEmailVerification = await EmailVerification.findOne({email, reason}).lean<IEmailVerification>().exec();
        if (!emailVerification) return null;
        const currentTime = moment();
        const expiresIn = moment(emailVerification.expiresIn);
        return expiresIn.isAfter(currentTime) ? emailVerification : null;
    }
}
