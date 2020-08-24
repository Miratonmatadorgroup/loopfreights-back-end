
export const locationDef = {
    name: {type: String},
    address: {type: String},
    latitude: {type: Number},
    longitude: {type: Number},
    type: {type: String},
    coordinates: {type: [Number]},
    positionsPolyline: {type: String},
    distanceMatrix: {
        distance: {type: String},
        duration: {type: String},
        distanceValue: {type: Number},
        durationValue: {type: Number},
        encodedPolyline: {type: String, required: false}
    }
};
