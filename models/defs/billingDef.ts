import {paymentMethodDef} from "./paymentMethodDef";

export const billingDef = {
    totalFare: {type: Number},
    onPeek: {type: Boolean, default: false},
    paid: {type: Boolean, default: false},
    paymentMethod: paymentMethodDef,
    error: {
        message: {type: String},
        count: {type: Number}
    }
}
