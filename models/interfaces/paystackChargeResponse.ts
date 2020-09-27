import {PaystackChargeStatus} from "../enums/paystackData";
import {IBank} from "./bank";

export interface IPaystackResponse {
    status: boolean;
    message: string;
    data: any;
}
export interface IPaystackChargeResponse extends IPaystackResponse {
    data: {
        amount: number;
        currency: string;
        transaction_date: string;
        status: PaystackChargeStatus;
        reference: string;
        domain: string;
        gateway_response: string;
        message: string;
        channel: string;
        fees: number;
        url?: string;
        authorization: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            card_type: string;
            brand: string;
            signature: string;
            reusable: boolean;
        }
    };
}

export interface IPaystackResolveBankResponse extends IPaystackResponse {
    data: {
        account_number: string;
        account_name: string;
    }
}

export interface IPaystackBanksResponse extends IPaystackResponse {
    data: IBank[];
}
