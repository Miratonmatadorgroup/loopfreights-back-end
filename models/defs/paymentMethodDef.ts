import {PaymentMethodType, PaymentMethodTypeName} from "../enums/paymentMethod";

export const paymentMethodDef = {
    name: {type: String, default: PaymentMethodTypeName.WALLET},
    type: {type: String, default: PaymentMethodType.WALLET},
    itemId: {type: String}
};
