import {UserRole} from "./enums/userRole";
import {model, Model, Schema, Types} from "mongoose";
import {IBaseDocument} from "./interfaces/baseInterface";
import {DriverType} from "./enums/driverType";

export interface IUserProfile extends IBaseDocument {
    enabled: boolean;
    message: string;
    totalRating: number;
    averageRating: number;
    profileImage: string;
    profileImageThumbnail: string;
    type: DriverType;
}
export interface IUser extends IBaseDocument {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emailVerified: boolean;
    roles: UserRole[];
    driverProfile: IUserProfile;
    userProfile: IUserProfile;
}

const userSchema = new Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},
    phone: {type: String, required: true},
    emailVerified: {type: Boolean, default: false},
    roles: {type: [], default: [UserRole.BASIC]},
    driverProfile: {
        _id: {type: Schema.Types.ObjectId, default: Types.ObjectId()},
        enabled: {type: Boolean, default: false},
        message: {type: String, default: 'Documents not uploaded'},
        totalRating: {type: Number, default: 0},
        averageRating: {type: Number, default: 5},
        profileImage: {type: String, required: false},
        profileImageThumbnail: {type: String, required: false},
        platformFees: {type: Number},
        type: {type: String, required: true}
    },
    userProfile: {
        _id: {type: Schema.Types.ObjectId, default: Types.ObjectId()},
        enabled: {type: Boolean, default: true},
        totalRating: {type: Number, default: 0},
        averageRating: {type: Number, default: 5},
        profileImage: {type: String, required: false},
        profileImageThumbnail: {type: String, required: false},
    }
}, {timestamps: true});

export const User: Model<IUser> = model<IUser>('user', userSchema);
