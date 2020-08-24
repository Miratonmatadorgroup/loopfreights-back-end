import {PaymentMethodType, PaymentMethodTypeName} from "../enums/paymentMethod";

export const paymentMethodDef = {
    name: {type: String, default: PaymentMethodTypeName.CASH},
    type: {type: String, default: PaymentMethodType.CASH},
    itemId: {type: String}
};
