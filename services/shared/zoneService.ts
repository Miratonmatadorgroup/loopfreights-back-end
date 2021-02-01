import {IZone, Zone} from "../../models/zone";
import {createError} from "../../utils/response";
import {IPlace} from "../../models/interfaces/googleApi";
import {ZoneClass} from "../../models/enums/zoneClass";

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

    public async getZoneByPlace(place: IPlace): Promise<IZone> {
        if (!place.address_components) throw createError('Place address component is required', 400);
        if (!place.place_id) throw createError('Place id is required', 400);
        const lgaComponents = place.address_components?.filter(component => component.types.includes('administrative_area_level_2')) || []
        const stateComponents = place.address_components?.filter(component => component.types.includes('administrative_area_level_1')) || []
        const lga: string = (lgaComponents[0]?.long_name?.toLowerCase() || '').toLowerCase()
        const state: string = (stateComponents[0]?.short_name?.toLowerCase() || '').toLowerCase()
        console.log(`Lga: ${lga}, State: ${state}`)
        const zones: IZone[] = await Zone.find().lean<IZone>().exec();
        let zone: IZone = zones.filter(z => z.lgas.includes(lga))[0]
        if (!zone) zone = zones.filter(z => z.states.includes(state))[0]
        if (!zone) zone = zones.filter(z => z.zoneClass.toLowerCase() === ZoneClass.E)[0];
        return zone;
    }

}
