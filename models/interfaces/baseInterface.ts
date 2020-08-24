import {Document} from "mongoose";

export interface IBaseInterface {
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBaseDocument extends Document, IBaseInterface {
    _id: string;
}
