import {model, Model, Schema} from "mongoose";
import {IBaseDocument} from "./interfaces/baseInterface";
import {AuthVerificationReason} from "./enums/authVerificationReason";

export interface IEmailVerification extends IBaseDocument {
    reason: AuthVerificationReason;
    email: string;
    expiresIn: Date;
    code: string;
    verified: boolean;
}

const emailVerificationSchema = new Schema({
    reason: {type: String, required: true},
    email: {type: String, required: true},
    expiresIn: {type: Date, required: true},
    code: {type: String, required: true},
    verified: {type: Boolean, default: false}
}, {timestamps: true});

export const EmailVerification: Model<IEmailVerification> = model<IEmailVerification>('emailVerification', emailVerificationSchema);
