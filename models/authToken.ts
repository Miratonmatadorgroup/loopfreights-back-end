import {Schema, Document, Model, model} from "mongoose";
import {UserRole} from "./enums/userRole";

export interface IAuthToken extends Document {
    userId: string;
    role: UserRole;
    deviceId: string;
    token: string;
    lastLogin: Date;
}

const fcmTokenSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
    role: {type: String, required: true},
    deviceId: {type: String, required: true},
    token: {type: String, required: true},
    lastLogin: {type: Date},
}, {timestamps: true});

export const AuthToken: Model<IAuthToken> = model<IAuthToken>('authToken', fcmTokenSchema);
