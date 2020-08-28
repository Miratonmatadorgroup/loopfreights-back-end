import {IPaymentMethod} from "./paymentMethod";

export interface IBilling {
    totalFare: number;
    onPeek: boolean;
    paid?: boolean;
    paymentMethod?: IPaymentMethod;
    error?: {
        message: string;
        count: number;
    };
}
