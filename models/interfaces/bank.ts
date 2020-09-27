import {IBaseDocument} from "./baseInterface";

export interface IBank extends IBaseDocument {
    id: number;
    name: string;
    slug: string;
    code: string;
}
