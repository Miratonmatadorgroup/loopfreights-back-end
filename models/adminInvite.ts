import {IBaseDocument} from "./interfaces/baseInterface";
import {model, Model, Schema} from "mongoose";

export interface IAdminInvite extends IBaseDocument {
    email: string;
    invitee: string;
    expiresIn: Date;
    verified: boolean;
    token: string;
}

const adminInviteSchema = new Schema({
    email: {type: String, required: true},
    invitee: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
    expiresIn: {type: Date, required: true},
    verified: {type: Boolean, default: false},
    token: {type: String, required: true},
}, {timestamps: true});

export const AdminInvite: Model<IAdminInvite> = model<IAdminInvite>('adminInvite', adminInviteSchema)
