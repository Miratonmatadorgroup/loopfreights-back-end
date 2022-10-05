import {IEmailTemplatePayload} from "../../models/interfaces/emailTemplatePayload";
import {config} from "../../config/config";
import {IUser, User} from "../../models/user";
import {UserRole} from "../../models/enums/userRole";

const sendGrid = require('@sendgrid/mail');
sendGrid.setApiKey(config.sendGridApiKey);

const from = {
    name: 'LoopFreights',
    email: 'noreply@loopfreights.com'
};

export class EmailNotificationService {

    public sendEmail(subject: string, text: string, emailTemplatePayload?: IEmailTemplatePayload) {
        new Promise(async (accept, reject) => {
            const admins: IUser[] = await User.find({roles: {$in: UserRole.ADMIN}} as any).lean<IUser>().exec()
            const adminEmails: string[] = admins.map(admin => admin.email);
            console.log('Sending email to admins: ', adminEmails)
            const dynamicTemplateData = emailTemplatePayload ? {} : null;
            if (emailTemplatePayload) {
                for (const value of emailTemplatePayload.data) {
                    dynamicTemplateData[value.key] = value.value;
                }
            }
            await sendGrid.send({
                from, to: adminEmails, subject, text, html: text,
                templateId: emailTemplatePayload ? emailTemplatePayload.templateId : null,
                dynamicTemplateData: dynamicTemplateData
            }).catch(err => {
                reject(err);
            });
            accept(null);
        }).catch(err => {
            console.error('SendGrid send error: ', err);
        });
    }

}
