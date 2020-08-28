import {DriverLocation, IDriverLocation} from "../../models/driverLocation";
import {getUpdateOptions} from "../../utils/utils";
import {createError} from "../../utils/response";
import {DeliveryService} from "./deliveryService";

export class LocationService {

    public async addLocation(userId: string, location: IDriverLocation): Promise<IDriverLocation> {
        const driverLocation: IDriverLocation = await DriverLocation.findOneAndUpdate({userId}, location, getUpdateOptions()).lean<IDriverLocation>().exec();
        DeliveryService.updateDeliveriesEta(driverLocation);
        return driverLocation;
    }

    public async getLocation(userId: string, validate = true): Promise<IDriverLocation> {
        const driverLocation: IDriverLocation = await DriverLocation.findOne({userId}).lean<IDriverLocation>().exec();
        if (!driverLocation && validate)
            throw createError('Driver location not found', 404);
        return driverLocation;
    }

    public async getClosestDriversTo(latitude, longitude): Promise<IDriverLocation[]> {
        const geoJSONPoint = {type: 'Point', coordinates: [longitude, latitude]};
        console.log('GeoJSON point: ', geoJSONPoint);
        return await DriverLocation.find({
            loc: {
                $near: {
                    $geometry: geoJSONPoint,
                    $maxDistance: 50000
                }
            }
        }).limit(8).lean<IDriverLocation>().exec();
    }

    public async removeLocation(userId: string): Promise<IDriverLocation> {
        return await DriverLocation.findOneAndRemove({userId}).lean<IDriverLocation>().exec();
    }
}
