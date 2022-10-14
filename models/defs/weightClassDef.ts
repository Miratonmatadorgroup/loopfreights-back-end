export const weightClassDef = {
    name: {type: String, required: true},
    carriageTypeIdentifier: {type: String, required: true},
    weight: {type: Number, required: true},
    baseFare: {type: Number, required: true},
    bookingFee: {type: Number, required: true, default: 0},
    pricePerMin: {type: Number, required: true, default: 0},
    pricePerKm: {type: Number, required: true},
    pricePerKg: {type: Number, default: 0}
}
