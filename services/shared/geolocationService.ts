import {
    IPlaceDirectionsResponse,
    IGoogleResponse,
    IPlace,
    IPlaceDetailResponse,
    IPlacePrediction,
    IPlacePredictionResponse, IReverseGeocodeResponse, IPlaceRoute, IPlaceDistanceMatrixRow, IDistanceMatrixResponse
} from "../../models/interfaces/googleApi";
import {GoogleApiRoute} from "../../models/enums/googleApiRoute";
import {config} from "../../config/config";
import request from "request-promise";
import {createError} from "../../utils/response";

export class GeolocationService {

    public async autoComplete(query: string): Promise<IPlacePrediction[]> {
        query = query || "";
        const result: IPlacePredictionResponse = await GeolocationService.callGoogle<IPlacePredictionResponse>(
            GeolocationService.createGoogleMapsUri(GoogleApiRoute.PLACE_AUTOCOMPLETE, `?input=${query}&location=9.0064811,4.177441&radius=800000&strictbounds=true&language=en`)
        );
        return result.predictions;
    }

    public async getPlaceDetails(placeId: string): Promise<IPlace | null> {
        if (!placeId) throw createError('Place id is required', 400);
        const result: IPlaceDetailResponse = await GeolocationService.callGoogle<IPlaceDetailResponse>(
            GeolocationService.createGoogleMapsUri(GoogleApiRoute.PLACE_DETAILS, `?placeid=${placeId}&language=en`)
        );
        return result.result;
    }

    public async reverseGeoCode(latitude: number, longitude: number): Promise<IPlace[]> {
        if (!latitude) throw createError('Latitude is required', 400);
        if (!longitude) throw createError('Longitude is required', 400);
        const result: IReverseGeocodeResponse = await GeolocationService.callGoogle<IReverseGeocodeResponse>(
            GeolocationService.createGoogleMapsUri(GoogleApiRoute.GEOCODE, `?latlng=${latitude},${longitude}`)
        );
        return result.results;
    }

    public async getDistanceMatrix(startLatitude: number, startLongitude: number, destinations: Array<{latitude: number, longitude: number}>)
        : Promise<IPlaceDistanceMatrixRow[]> {
        const destinationStringList: string[] = destinations.map(destination => {
            return `${destination.latitude},${destination.longitude}`;
        });
        const destinationString = destinationStringList.join('|');
        const result: IDistanceMatrixResponse = await GeolocationService.callGoogle<IDistanceMatrixResponse>(
            GeolocationService.createGoogleMapsUri(GoogleApiRoute.GEOCODE, `?origins=${startLatitude},${startLongitude}&destinations=${destinationString}&region=NG&units=metric`)
        );
        return result.rows;
    }

    public async getDirections(startLatitude: number, startLongitude: number, endLatitude: number, endLongitude: number,
                               wayPoints?: Array<{latitude: number, longitude: number}>): Promise<IPlaceRoute[]> {
        let path = `?origin=${startLatitude},${startLongitude}&destination=${endLatitude},${endLongitude}&mode=driving&unit=metric`;
        if (wayPoints && wayPoints.length > 0) {
            path = path.concat('&waypoints=');
            for (let i = 0; i < wayPoints.length; i++) {
                const wayPoint = wayPoints[i];
                path = path.concat(`${wayPoint.latitude},${wayPoint.longitude}`, i < wayPoints.length - 1 ? '|' : '');
            }
        }
        const result: IPlaceDirectionsResponse = await GeolocationService.callGoogle<IPlaceDirectionsResponse>(
            GeolocationService.createGoogleMapsUri(GoogleApiRoute.DIRECTIONS, path)
        );
        return result.routes;
    }
    public static createGoogleMapsUri(route: GoogleApiRoute, path: string): string {
        const url = `https://maps.googleapis.com/maps/api/${route}/json`.concat(path).concat(`&key=${config.googleApiKey}`);
        console.log('Calling google: ', url);
        return url;
    }

    private static async callGoogle<T extends IGoogleResponse>(url: string): Promise<T> {
        const result: IGoogleResponse = await request(url, {
            method: 'GET',
            timeout: 60000,
            json: true
        });
        if (result.status !== 'OK')
            console.warn(`Google result status not OK. Status is ${result.status}`);
        return result as T;
    }
}
