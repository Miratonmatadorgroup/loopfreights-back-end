
export enum EmailTemplateId {
    EMAIL_VERIFICATION = 'd-17988ba0f5d0475b9015f4c7c00268e6'
}

export interface IEmailTemplatePayload {
    templateId: string;
    data: {key: string, value: string}[];
}
