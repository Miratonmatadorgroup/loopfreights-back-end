import {IZone, Zone} from "../../models/zone";
import {createError} from "../../utils/response";

export class ZoneService {

    public async addZone(body: IZone): Promise<IZone> {
        if (!body.zoneClass) throw createError('Zone class is required', 400);
        if (!body.name) throw createError('Zone name is required', 400);
        if (!body.states) throw createError('Zone state is required', 400);
        if (await this.doesZoneExist(body.name)) throw createError(`Zone ${body.name} already exists`, 400);
        if (await this.doesZoneClassExist(body.zoneClass)) throw createError(`Zone class ${body.zoneClass} already exists`, 400);
        if (typeof body.states === "string")
            body.states = (body.states as string).split(',').filter(value => value.trim()).map(value => value.toLowerCase());
        if (body.lgas && typeof body.lgas === "string")
            body.lgas = ((body.lgas as string).split(',').filter(value => value.trim())).map(value => value.toLowerCase());
        return await new Zone(body).save();
    }

    public async getZones(): Promise<IZone[]> {
        return await Zone.find().lean<IZone>().exec();
    }

    // noinspection JSMethodCanBeStatic
    private async doesZoneExist(name): Promise<boolean> {
        const count = await Zone.countDocuments({name}).exec();
        return count > 0;
    }

    // noinspection JSMethodCanBeStatic
    private async doesZoneClassExist(zoneClass): Promise<boolean> {
        const count = await Zone.countDocuments({zoneClass}).exec();
        return count > 0;
    }

}
