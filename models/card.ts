import {IBaseDocument} from "./interfaces/baseInterface";

export interface ICard extends IBaseDocument {
    userId: string;
    number?: string;
    expMonth?: string;
    expYear?: string;
    cvv?: string;
    authorization: string;
}
