import {IBaseDocument} from "./interfaces/baseInterface";
import {DriverDocumentType} from "./enums/driverDocumentType";
import {model, Model, Schema} from "mongoose";

export interface IDriverDocument extends IBaseDocument {
    userId: string;
    type: DriverDocumentType;
    imageUri: string;
    imageUriThumbnail: string;
    content: string;
    requiresImage: boolean;
    requiresContent: boolean;
}

const driverDocumentSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    type: {type: String, required: true},
    imageUri: {type: String, required: false},
    imageUriThumbnail: {type: String, required: false},
    content: {type: String, required: true},
    requiresImage: {type: Boolean, default: false},
    requiresContent: {type: Boolean, default: false}
}, {timestamps: true});

export const DriverDocument: Model<IDriverDocument> = model<IDriverDocument>('driverDocument', driverDocumentSchema);
