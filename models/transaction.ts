import {IBaseDocument} from "./interfaces/baseInterface";
import {TransactionType} from "./enums/transactionType";
import {UserRole} from "./enums/userRole";
import {model, Model, Schema} from "mongoose";
import {PaymentMethodType} from "./enums/paymentMethod";

export interface ITransaction extends IBaseDocument {
    type: TransactionType;
    role: UserRole;
    paymentType: PaymentMethodType;
    userId: string;
    itemId: string;
    amount: number;
    description: string;
}

const transactionReferenceSchema = new Schema({
    type: {type: String, required: true},
    role: {type: String, required: true},
    paymentType: {type: String, required: true},
    userId: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    itemId: {type: Schema.Types.ObjectId, required: true},
    amount: {type: Number, required: true},
    description: {type: String, required: true}
}, {timestamps: true});

export const Transaction: Model<ITransaction> = model<ITransaction>('transaction', transactionReferenceSchema);
