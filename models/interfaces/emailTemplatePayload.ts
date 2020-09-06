
export enum EmailTemplateId {
    EMAIL_VERIFICATION = 'd-17988ba0f5d0475b9015f4c7c00268e6',
    DRIVER_ACCOUNT_DISABLED = 'd-db8921f5507b4018a0b9ed411a5251d2',
    DRIVER_ACCOUNT_ENABLED = 'd-b658d1f63fd042449b217d026c3081a0',
    ADMIN_DELIVERY_UPDATE = 'd-35571674ed004bc9b53b4374d673da39',
    USER_MESSAGE = 'd-84cdd3f849b64a8d884b35cade1801cb',
    ADMIN_INVITE = 'd-e19f4a870f9d4dfc809e4a16bc90ceaf'
}

export interface IEmailTemplatePayload {
    templateId: EmailTemplateId;
    data: {key: string, value: string}[];
}
