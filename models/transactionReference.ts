import {IBaseDocument} from "./interfaces/baseInterface";
import {TransactionReason} from "./enums/transactionReason";
import {model, Model, Schema} from "mongoose";
import {UserRole} from "./enums/userRole";

export interface ITransactionReference extends IBaseDocument {
    userId: string;
    reference: string;
    amount: number;
    reason: TransactionReason;
    role: UserRole;
    used: boolean;
    itemId: string;
    saveCard: boolean;
}

const transactionReferenceSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    reference: {type: String, required: true},
    amount: {type: Number, required: true},
    reason: {type: String, required: true},
    role: {type: String, required: true},
    used: {type: Boolean, default: false},
    itemId: {type: String, required: false},
    saveCard: {type: Boolean, default: false}
}, {timestamps: true});

export const TransactionReference: Model<ITransactionReference> = model<ITransactionReference>('transactionReference', transactionReferenceSchema);
