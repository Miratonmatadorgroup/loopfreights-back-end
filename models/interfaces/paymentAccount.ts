import {IBaseInterface} from "./baseInterface";

export interface IPaymentAccount extends IBaseInterface {
    accountName: string;
    accountNumber: string;
    bank: string;
    bankCode: string;
}
