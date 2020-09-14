import {IBaseDocument} from "./interfaces/baseInterface";
import {model, Model, Schema} from "mongoose";

export interface IWallet extends IBaseDocument {
    userId: string;
    balance: number;
    bonusBalance: number;
}

const walletSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    balance: {type: Number, default: 0, required: true},
    bonusBalance: {type: Number, default: 0}
}, {timestamps: true});

export const Wallet: Model<IWallet> = model<IWallet>('wallet', walletSchema);
