import {IBaseDocument, IBaseInterface} from "./interfaces/baseInterface";
import {IUser} from "./user";
import {IPaymentMethod} from "./interfaces/paymentMethod";
import {model, Model, Schema} from "mongoose";
import {paymentMethodDef} from "./defs/paymentMethodDef";

export interface IPreference extends IBaseDocument {
    userId: string | IUser;
    paymentMethod: IPaymentMethod;
}

const preferenceSchema = new Schema({
    userId: {type: String, required: true},
    paymentMethod: paymentMethodDef
}, {timestamps: true});

export const Preference: Model<IPreference> = model<IPreference>('preference', preferenceSchema);
