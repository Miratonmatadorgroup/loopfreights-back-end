import {IBaseDocument} from "./interfaces/baseInterface";
import {model, Model, Schema} from "mongoose";
import {UserSegment} from "./enums/userSegment";
import {UserRole} from "./enums/userRole";

export interface IPromotion extends IBaseDocument {
    title: string;
    description: string;
    value: number;
    userSegment: UserSegment;
    participants: string[];
    role: UserRole;
}

const promotionSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    value: {type: Number, required: true},
    userSegment: {type: String, required: true},
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }],
    role: {type: String, required: true},
}, {timestamps: true});

export const Promotion: Model<IPromotion> = model<IPromotion>('promotion', promotionSchema);
