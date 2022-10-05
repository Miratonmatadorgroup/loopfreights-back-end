import {paymentMethodDef} from "./paymentMethodDef";
import {carriageTypeDef} from "./carriageTypeDef";
import {weightClassDef} from "./weightClassDef";

export const billingDef = {
    totalFare: {type: Number},
    totalFareText: {type: String},
    items: {
        type: [{
            title: {type: String},
            value: {type: Number},
            valueText: {type: String}
        }], default: []
    },
    carriageType: carriageTypeDef,
    weightClass: weightClassDef,
    onPeek: {type: Boolean, default: false},
    paid: {type: Boolean, default: false},
    paymentMethod: paymentMethodDef,
    error: {
        message: {type: String},
        count: {type: Number}
    }
}
