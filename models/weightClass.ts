import {IBaseDocument} from "./interfaces/baseInterface";
import {model, Model, Schema} from "mongoose";
import {weightClassDef} from "./defs/weightClassDef";

export interface IWeightClass extends IBaseDocument {
    name: string;
    weight: number;
    carriageTypeIdentifier: string;
    pricePerKm: number
    baseFare: number
    bookingFee: number
    pricePerKg: number
    pricePerMin: number
}

const weightClassSchema = new Schema(weightClassDef, {timestamps: true})

export const WeightClass: Model<IWeightClass> = model<IWeightClass>('weightClass', weightClassSchema)
