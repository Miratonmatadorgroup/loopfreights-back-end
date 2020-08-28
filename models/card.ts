import {IBaseDocument} from "./interfaces/baseInterface";
import {model, Model, Schema} from "mongoose";

export interface ICard extends IBaseDocument {
    userId: string;
    number?: string;
    expMonth?: string;
    expYear?: string;
    cvv?: string;
    authorization: string;
    last4: string;
    bin: string;
    cardType: string;
    brand: string;
    signature: string;
    reusable: boolean;
}

const cardSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, required: true},
    bin: {type: String, required: true},
    brand: {type: String, required: true},
    last4: {type: String, required: true},
    expMonth: {type: String, required: true},
    expYear: {type: String, required: true},
    authorization: {type: String, required: true},
    signature: {type: String, required: true},
    reusable: {type: Boolean, default: false},
}, {timestamps: true});

export const Card: Model<ICard> = model<ICard>('card', cardSchema);
