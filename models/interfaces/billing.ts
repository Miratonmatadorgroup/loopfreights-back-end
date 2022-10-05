import {IPaymentMethod} from "./paymentMethod";
import {ICarriageType} from "../carriageType";
import {IWeightClass} from "../weightClass";

export interface IBillingItem {
    title: string
    value: number
    valueText: string
}

export interface IBilling {
    totalFare: number;
    totalFareText: string;
    items: IBillingItem[]
    carriageType: ICarriageType
    weightClass: IWeightClass
    paid?: boolean;
    paymentMethod?: IPaymentMethod;
    error?: {
        message: string;
        count: number;
    };
}
