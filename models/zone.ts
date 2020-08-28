import {IBaseDocument} from "./interfaces/baseInterface";
import {model, Model, Schema} from "mongoose";
import {ZoneClass} from "./enums/zoneClass";
import {zoneDef} from "./defs/zoneDef";

export interface IZone extends IBaseDocument {
    zoneClass: ZoneClass;
    name: string;
    states: string[];
    lgas: string[];
    parentZone: string;
}

const zoneSchema = new Schema(zoneDef, {timestamps: true});

export const Zone: Model<IZone> = model<IZone>('zone', zoneSchema);
