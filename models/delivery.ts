import {IBaseDocument} from "./interfaces/baseInterface";
import {IUser} from "./user";
import {IBilling} from "./interfaces/billing";
import {model, Model, Schema} from "mongoose";
import {billingDef} from "./defs/billingDef";
import {generate} from "voucher-code-generator";
import {DeliveryState} from "./enums/deliveryState";
import {IBaseLocation} from "./interfaces/location";
import {locationDef} from "./defs/locationDef";
import {IDriverLocation} from "./driverLocation";

export interface IStop extends IBaseDocument {
    receiver: string | IUser | undefined;
    location: IBaseLocation;
    state: DeliveryState.PENDING | DeliveryState.DROPPING_OFF | DeliveryState.AWAITING_SIGNATURE | DeliveryState.COMPLETE;
    dropOffStartTime: Date;
    dropOffEndTime: Date;
    dropOffConfirmed: boolean;
    verificationCode: string;
    lastMessageToReceiver: string;
    rawReceiver: {
        name: string;
        email: string;
    };
}

export interface IDelivery extends IBaseDocument {
    sender: string | IUser;
    driverLocation: IDriverLocation | undefined;
    pickUpLocation: IBaseLocation;
    stops: IStop[];
    billing: IBilling;
    state: DeliveryState;
    arrivalTime: Date;
    lastMessageToDriver: string;
    lastMessageToSender: string;
}

const deliverySchema = new Schema({
    sender: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    state: {type: String, default: DeliveryState.PENDING},
    billing: billingDef,
    pickUpLocation: locationDef,
    arrivalTime: {type: Date},
    lastMessageToDriver: {type: String, default: 'Please proceed to pick up'},
    lastMessageToSender: {type: String, default: 'Driver is coming to you'},
    driverLocation: Object.assign({
        userId: {type: Schema.Types.ObjectId, ref: 'user', required: false},
    }, locationDef),
    stops: {
        type: [{
            location: locationDef,
            receiver: {type: Schema.Types.ObjectId, ref: 'user', required: false},
            state: {type: String, default: DeliveryState.PENDING},
            verificationCode: {type: String, required: true, default: generate({charset: '1234567890', length: 4, count: 1})[0]},
            dropOffStartTime: {type: Date},
            dropOffEndTime: {type: Date},
            dropOffConfirmed: {type: Boolean, default: false},
            lastMessageToReceiver: {type: String, default: 'Driver has accepted delivery'},
            rawReceiver: {
                name: {type: String, required: true},
                email: {type: String, required: true}
            }
        }]
    }
}, {timestamps: true});

deliverySchema.pre('save', function(this: IDelivery, next) {
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
