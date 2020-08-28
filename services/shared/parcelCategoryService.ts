import {IParcelCategory, ParcelCategory} from "../../models/parcelCategory";
import {createError} from "../../utils/response";
import {ZoneClass} from "../../models/enums/zoneClass";
import {IZone} from "../../models/zone";

export class ParcelCategoryService {

    public async getParcelCategories(): Promise<IParcelCategory[]> {
        return await ParcelCategory.find().lean<IParcelCategory>().exec();
    }

    public async getCurrentCategoryPrice(categoryId: string, zone: IZone, onPeek = false): Promise<number> {
        const parcelCategory: IParcelCategory = await ParcelCategory.findById(categoryId).lean<IParcelCategory>();
        if (!parcelCategory) throw createError('Parcel category not found', 400);
        const billing = parcelCategory.billing.filter(currentBilling => currentBilling.zoneClass === zone.zoneClass)[0];
        if (!billing) throw createError(`Cannot get billing for zone '${zone.zoneClass}'`, 400);
        return onPeek ? billing.priceOnPeek : billing.price;
    }
}
