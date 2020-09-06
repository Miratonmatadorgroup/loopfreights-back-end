import { config } from "../../config/config";
import {EmailTemplateId, IEmailTemplatePayload} from "../../models/interfaces/emailTemplatePayload";

const sendGrid = require('@sendgrid/mail');
sendGrid.setApiKey(config.sendGridApiKey);

const from = {
    name: 'LoopFreights',
    email: 'noreply@loopfreights.com'
};

export class EmailService {

    public sendEmail(email: string, subject: string, text: string, emailTemplatePayload?: IEmailTemplatePayload) {
        new Promise(async (accept, reject) => {
            const dynamicTemplateData = emailTemplatePayload ? {} : null;
            if (emailTemplatePayload) {
                for (const value of emailTemplatePayload.data) {
                    dynamicTemplateData[value.key] = value.value;
                }
            }
            await sendGrid.send({
                from, to: email, subject, text, html: text,
                templateId: emailTemplatePayload ? emailTemplatePayload.templateId : null,
                dynamicTemplateData: dynamicTemplateData
            }).then(value => accept(value)).catch(err => {
                reject(err);
            });
        }).then(value => {
            console.log('SendGrid email sent: ', value)
        }).catch(err => {
            console.error('SendGrid send error: ', err);
        });
    }

}
