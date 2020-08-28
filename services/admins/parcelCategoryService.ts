import {getZoneClasses} from "../../models/enums/zoneClass";
import {IParcelCategory, ParcelCategory} from "../../models/parcelCategory";
import {createError} from "../../utils/response";

export class ParcelCategoryService {

    public async addParcelCategory(body: IParcelCategory): Promise<IParcelCategory> {
        if (!body.title) throw createError('Parcel title is required', 400);
        if (!body.description) throw createError('Parcel description is required', 400);
        if (!body.billing) throw createError('Billing is required', 400);
        const zoneClasses = getZoneClasses();
        if (body.billing.length !== zoneClasses.length) throw createError('Parcel billing category does not cover all zones', 400);
        for (const billing of body.billing) {
            if (!billing.zoneClass) throw createError(`Zone class at position ${body.billing.indexOf(billing) + 1} is not set`, 400);
            if (!billing.price) throw createError(`Billing price at position ${body.billing.indexOf(billing) + 1} is not set`, 400);
            billing.priceOnPeek = billing.priceOnPeek || billing.price;
        }
        if (await this.doesParcelCategoryExist(body.title))
            throw createError(`Parcel category with title '${body.title} already exists'`, 400);
        body.tags = body.description.split(',').map(tag => tag.trim().toLowerCase());
        return  await new ParcelCategory(body).save();
    }

    // noinspection JSMethodCanBeStatic
    private async doesParcelCategoryExist(title: string): Promise<boolean> {
        const count = await ParcelCategory.countDocuments({title}).exec();
        return count > 0;
    }
}
