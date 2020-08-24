import {IPaymentMethod} from "./paymentMethod";

export interface IBilling {
    pricePerKm: number;
    baseFare: number;
    priceForKm?: number;
    totalFare?: number;
    paid?: boolean;
    paymentMethod?: IPaymentMethod;
    error?: {
        message: string;
        count: number;
    };
}
