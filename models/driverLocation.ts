import {IBaseLocation} from "./interfaces/location";
import {IBaseDocument} from "./interfaces/baseInterface";
import {model, Model, Schema} from "mongoose";
import {locationDef} from "./defs/locationDef";
import {IUser} from "./user";

export interface IDriverLocation extends IBaseLocation, IBaseDocument {
    userId: string | IUser;
    loc: {
        type: string;
        coordinates: [number, number];
    };
}

const driverLocationSchema = new Schema(Object.assign({
    userId: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    loc: {
        type: {type: String},
        coordinates: {type: [Number]}
    }
}, locationDef), {timestamps: true});

driverLocationSchema.pre('save', function(this: any, next) {
    this.loc = {
        type: 'Point',
        coordinates: [this.longitude, this.latitude]
    };
    next();
});

driverLocationSchema.pre('findOneAndUpdate', function(this: any, next) {
    const update = this._update;
    console.log('Updating: ', update);
    this.update({}, {
        $set: {
            loc: {
                type: 'Point',
                coordinates: [update.longitude, update.latitude]
            }
        }
    });
    next();
});
driverLocationSchema.index({loc: '2dsphere'});
export const DriverLocation: Model<IDriverLocation> = model<IDriverLocation>('driverLocation', driverLocationSchema);
