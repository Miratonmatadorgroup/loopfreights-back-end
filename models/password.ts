import {model, Model, Schema, Document} from "mongoose";
import {IBaseDocument} from "./interfaces/baseInterface";

export interface IPassword extends IBaseDocument {
    userId: string;
    password: string;
    generatedPassword?: string;
}

const passwordSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
    password: {type: String, required: true},
    generatedPassword: {type: String}
}, {timestamps: true});

export const Password: Model<IPassword> = model<IPassword>('password', passwordSchema);
