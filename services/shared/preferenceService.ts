import {IPreference, Preference} from "../../models/preference";
import {getUpdateOptions} from "../../utils/utils";
import {IPaymentMethod} from "../../models/interfaces/paymentMethod";

export class PreferenceService {

    public async ensurePreferences(userId: string): Promise<IPreference> {
        return await Preference.findOneAndUpdate({userId}, {}, getUpdateOptions())
            .lean<IPreference>().exec();
    }

    public async getPaymentMethodPreference(userId: string): Promise<IPaymentMethod> {
        const preference: IPreference = await this.ensurePreferences(userId);
        return preference.paymentMethod;
    }
}
