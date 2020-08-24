import {PaymentMethodType, PaymentMethodTypeName} from "../enums/paymentMethod";

export interface IPaymentMethod {
    name: PaymentMethodTypeName;
    type: PaymentMethodType;
    itemId: string;
}
