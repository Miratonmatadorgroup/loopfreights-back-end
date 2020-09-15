import {IBaseDocument} from "./interfaces/baseInterface";
import {UserRole} from "./enums/userRole";
import {model, Model, Schema} from "mongoose";

export interface IEarning extends IBaseDocument {
    userId: string;
    role: UserRole;
    amount: number;
    fees: number;
    amountMinusFees: number;
    disbursed: boolean;
    // For mapping by day
    day?: number;
}

export interface IEarningByDay {
    day: number;
    dayName: string;
    total: number;
}

export interface IEarningSummary {
    title: string;
    amount: number;
}

const earningSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    role: {type: String, required: true},
    amount: {type: Number, required: true},
    fees: {type: Number, default: 0},
    amountMinusFees: {type: Number, required: true},
    disbursed: {type: Boolean, default: false}
}, {timestamps: true});

export const Earning: Model<IEarning> = model<IEarning>('earning', earningSchema);
