import {IBaseDocument} from "./interfaces/baseInterface";
import {IUser} from "./user";
import {IBilling} from "./interfaces/billing";
import {model, Model, Schema} from "mongoose";
import {billingDef} from "./defs/billingDef";
import {charset, generate} from "voucher-code-generator";
import {DeliveryState} from "./enums/deliveryState";
import {IBaseLocation} from "./interfaces/location";
import {locationDef} from "./defs/locationDef";
import {IDriverLocation} from "./driverLocation";
import {weightClassDef} from "./defs/weightClassDef";
import {ICarriageType} from "./carriageType";
import {carriageTypeDef} from "./defs/carriageTypeDef";
import {IWeightClass} from "./weightClass";

export interface IParcel extends IBaseDocument {
    description: string
    quantity: number;
    contentUri: string;
    weight: number;
}

export interface IStop extends IBaseDocument {
    identifier: string;
    receiver: string | IUser | undefined;
    location: IBaseLocation;
    state: DeliveryState.PENDING | DeliveryState.DROPPING_OFF | DeliveryState.AWAITING_SIGNATURE | DeliveryState.COMPLETE;
    pickUpStartTime: Date;
    dropOffStartTime: Date;
    dropOffEndTime: Date;
    dropOffConfirmed: boolean;
    verificationCode: string;
    lastMessageToReceiver: string;
    parcel: IParcel;
    rawReceiver: {
        name: string;
        phone: string;
    };
}

export interface IDelivery extends IBaseDocument {
    sender: string | IUser;
    driverLocation: IDriverLocation | undefined;
    pickUpLocation: IBaseLocation;
    stops: IStop[];
    billing: IBilling;
    state: DeliveryState;
    reviewed: boolean
    approved: boolean
    deliveryId: string;
    acceptedTime: Date;
    arrivalTime: Date;
    lastMessageToDriver: string;
    lastMessageToSender: string;
    etaToNextStop: string;
    pathToNextStop: string;
    userRating: number;
    riderRating: number;
    adminComment: string;
    userComment: string;
    riderComment: string;
}

const deliverySchema = new Schema({
    sender: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    state: {type: String, default: DeliveryState.PENDING},
    deliveryId: {type: String, default: generate({pattern: "###-###", length: 1, charset: charset("alphanumeric")})[0]},
    billing: billingDef,
    pickUpLocation: locationDef,
    acceptedTime: {type: Date},
    arrivalTime: {type: Date},
    reviewed: {type: Boolean, default: false},
    approved: {type: Boolean, default: false},
    lastMessageToDriver: {type: String, default: 'Please proceed to pick up'},
    lastMessageToSender: {type: String, default: 'Driver is coming to you'},
    driverLocation: Object.assign({
        userId: {type: Schema.Types.ObjectId, ref: 'user', required: false},
    }, locationDef),
    stops: {
        type: [{
            identifier: {type: String, required: true},
            receiver: {type: Schema.Types.ObjectId, ref: 'user', required: false},
            state: {type: String, default: DeliveryState.PENDING},
            verificationCode: {
                type: String,
                required: true,
                default: generate({charset: '1234567890', length: 4, count: 1})[0]
            },
            dropOffStartTime: {type: Date},
            dropOffEndTime: {type: Date},
            dropOffConfirmed: {type: Boolean, default: false},
            lastMessageToReceiver: {type: String, default: 'Driver has accepted delivery'},
            parcel: {
                description: {type: String, required: true},
                quantity: {type: Number, default: 1},
                contentUri: {type: String, required: true},
                weight: {type: Number, required: true}
            },
            location: locationDef,
            rawReceiver: {
                name: {type: String, required: true},
                phone: {type: String, required: true}
            }
        }]
    },
    etaToNextStop: {type: String, required: false},
    pathToNextStop: {type: String, required: false},
    userRating: {type: Number, default: 0},
    riderRating: {type: Number, default: 0},
    adminComment: {type: String},
    userComment: {type: String},
    riderComment: {type: String}
}, {timestamps: true});

deliverySchema.pre('save', function (this: IDelivery, next) {
    this.pickUpLocation.type = 'Point';
    this.pickUpLocation.coordinates = [this.pickUpLocation.longitude, this.pickUpLocation.latitude];
    for (const stop of this.stops) {
        stop.location.type = 'Point';
        stop.location.coordinates = [stop.location.longitude, stop.location.latitude];
    }
    next();
});

deliverySchema.index({'pickUpLocation': '2dsphere'});
deliverySchema.index({'stops.location': '2dsphere'});
export const Delivery: Model<IDelivery> = model<IDelivery>('delivery', deliverySchema);
