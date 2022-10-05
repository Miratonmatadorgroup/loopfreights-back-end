import {model, Model, Schema} from "mongoose";
import {carriageTypeDef} from "./defs/carriageTypeDef";
import {IBaseDocument} from "./interfaces/baseInterface";

export interface ICarriageType extends IBaseDocument {
    name: string
    identifier: string
    imageUrl?: string
    imageThumbnailUrl?: string
}

export const carriageTypeSchema = new Schema(carriageTypeDef, {
    timestamps: true
})

export const generateIdentifier = (name: string): string => {
    return name.trim().replace(new RegExp(" ", "g"), "_").toLowerCase()
}

export const CarriageType: Model<ICarriageType> = model<ICarriageType>('carriageType', carriageTypeSchema)
