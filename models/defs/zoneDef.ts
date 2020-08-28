import {Schema} from "mongoose";

export const zoneDef = {
    zoneClass: {type: String, required: false},
    name: {type: String, required: false},
    states: {type: [String], required: false, lowercase: true},
    lgas: {type: [String], required: false, lowercase: true},
    parentZone: {type: Schema.Types.ObjectId, required: false}
};
