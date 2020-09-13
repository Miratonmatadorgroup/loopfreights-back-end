import {getZoneClasses, ZoneClass} from "../../models/enums/zoneClass";
import {IParcelCategory, ParcelCategory} from "../../models/parcelCategory";
import {createError} from "../../utils/response";
import {IZone} from "../../models/zone";
import {ZoneService} from "./zoneService";
import {stripUpdateFields} from "../../utils/utils";

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

    public async getParcelCategories(): Promise<IParcelCategory[]> {
        const zones: IZone[] = await new ZoneService().getZones();
        const zoneMap: Map<ZoneClass, IZone> = new Map<ZoneClass, IZone>(zones.map(zone => {
            return [zone.zoneClass, zone];
        }))
        return (await ParcelCategory.find()
            .lean<IParcelCategory>()
            .exec()).map(parcelCategory => {
                parcelCategory.billing = parcelCategory.billing.map(billing => {
                    billing.zone = zoneMap.get(billing.zoneClass);
                    return billing;
                });
                return parcelCategory;
        });
    }

    public async updateParcelCategory(id: string, body: IParcelCategory): Promise<IParcelCategory> {
        stripUpdateFields(body)
        const parcelCategory: IParcelCategory = await ParcelCategory.findByIdAndUpdate(id, body)
            .lean<IParcelCategory>()
            .exec();
        if (!parcelCategory) throw createError('Parcel category not found', 404);
        return parcelCategory;
    }

    // noinspection JSMethodCanBeStatic
    private async doesParcelCategoryExist(title: string): Promise<boolean> {
        const count = await ParcelCategory.countDocuments({title}).exec();
        return count > 0;
    }
}
