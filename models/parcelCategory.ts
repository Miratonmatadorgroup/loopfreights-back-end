import {IBaseDocument} from "./interfaces/baseInterface";
import {ZoneClass} from "./enums/zoneClass";
import {model, Model, Schema} from "mongoose";

export interface IParcelBilling {
    zoneClass: ZoneClass;
    price: number;
    priceOnPeek: number;
}
export interface IParcelCategory extends IBaseDocument {
    title: string;
    description: string;
    billing: IParcelBilling[];
    tags: string[];
}

const parcelCategorySchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    billing: {type: [{zoneClass: String, price: Number, priceOnPeek: Number}], required: true},
    tags: {type: [String], required: false}
}, {timestamps: true});

export const ParcelCategory: Model<IParcelCategory> = model<IParcelCategory>('parcelCategory', parcelCategorySchema);
