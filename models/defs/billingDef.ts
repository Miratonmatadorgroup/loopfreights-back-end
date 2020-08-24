import {paymentMethodDef} from "./paymentMethodDef";

export const billingDef = {
    pricePerKm: {type: Number},
    baseFare: {type: Number},
    priceForKm: {type: Number},
    totalFare: {type: Number},
    paid: {type: Boolean, default: false},
    paymentMethod: paymentMethodDef,
    error: {
        message: {type: String},
        count: {type: Number}
    }
}
