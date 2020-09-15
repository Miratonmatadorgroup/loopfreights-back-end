import {IBaseDocument} from "./interfaces/baseInterface";
import {model, Model, Schema} from "mongoose";

export interface IPlatformConfiguration extends IBaseDocument {
    externalDriversFee: number;
    autoDisburseEarnings: boolean;
    allowNewDriverSignUp: boolean;
    allowNewUserSignUp: boolean;
}

const platformConfigurationSchema = new Schema({
    externalDriversFee: {type: Number, default: 30},
    autoDisburseEarnings: {type: Boolean, default: false},
    allowNewDriverSignUp: {type: Boolean, default: true},
    allowNewUserSignUp: {type: Boolean, default: true}
}, {timestamps: true});

export const PlatformConfiguration: Model<IPlatformConfiguration> = model<IPlatformConfiguration>('platformConfiguration', platformConfigurationSchema);
