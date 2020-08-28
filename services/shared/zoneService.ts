import {IZone, Zone} from "../../models/zone";
import {createError} from "../../utils/response";

export class ZoneService {

    public async getZones(): Promise<IZone[]> {
        return await Zone.find().lean<IZone>().exec();
    }

    public async getZoneByLga(lga: string, validate = true): Promise<IZone> {
        // @ts-ignore
        const zone: IZone = await Zone.find({lgas: {$in: lga}}).lean<IZone>().exec();
        if (!zone && validate)
            throw createError(`Zone with lga '${lga}' does not exist`, 400);
        return zone;
    }

}
