import {Schema, Model, model} from "mongoose";
import {IBaseDocument} from "./interfaces/baseInterface";
import {UserRole} from "./enums/userRole";

export interface IFcmToken extends IBaseDocument {
    userId: string;
    role: UserRole;
    token: string;
}

const fcmTokenSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, required: true},
    role: {type: String, required: true, default: UserRole.BASIC},
    token: {type: String, required: true}
}, {timestamps: true});

export const FcmToken: Model<IFcmToken> = model<IFcmToken>('fcmToken', fcmTokenSchema);
