
export enum EmailTemplateId {
    EMAIL_VERIFICATION = 'd-17988ba0f5d0475b9015f4c7c00268e6',
    ADMIN_DELIVERY_UPDATE = 'd-35571674ed004bc9b53b4374d673da39',
}

export interface IEmailTemplatePayload {
    templateId: EmailTemplateId;
    data: {key: string, value: string}[];
}
