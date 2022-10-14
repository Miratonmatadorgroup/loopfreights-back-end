import {
    IDistanceMatrixResponse,
    IGoogleResponse,
    IPlace,
    IPlaceDetailResponse,
    IPlaceDirectionsResponse,
    IPlaceDistanceMatrixRow,
    IPlacePrediction,
    IPlacePredictionResponse,
    IPlaceRoute,
    IReverseGeocodeResponse
} from "../../models/interfaces/googleApi";
import {GoogleApiRoute, GooglePlaceDetailsSource} from "../../models/enums/googleApi";
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

    public async getPlaceDetails(placeId: string, source = GooglePlaceDetailsSource.PLACES_API): Promise<IPlace | null> {
        if (!placeId) throw createError('Place id is required', 400);
        const result: IPlaceDetailResponse = await GeolocationService.callGoogle<IPlaceDetailResponse>(
            GeolocationService.createGoogleMapsUri(GoogleApiRoute.PLACE_DETAILS, `?placeid=${placeId}&language=en`)
        );
        if (result.status !== 'OK') throw createError('Unable to get place', 400);
        if (source === GooglePlaceDetailsSource.PLACES_API) return result.result;
        const location = result.result?.geometry?.location;
        return (await this.reverseGeoCode(null, location.lat, location.lng))[0];
    }

    public async reverseGeoCode(address?: string, latitude?: number, longitude?: number, includeZone = false): Promise<IPlace[]> {
        if (!address) {
            if (!latitude) throw createError('Latitude or address is required', 400);
            if (!longitude) throw createError('Longitude or address is required', 400);
        }
        const path = address ? `?address=${encodeURI(address)}` : `?latlng=${latitude},${longitude}`;
        const result: IReverseGeocodeResponse = await GeolocationService.callGoogle<IReverseGeocodeResponse>(
            GeolocationService.createGoogleMapsUri(GoogleApiRoute.GEOCODE, path)
        );
        return result.results;
    }

    public async getDistanceMatrix(startLatitude: number, startLongitude: number, destinations: {latitude: number, longitude: number}[])
        : Promise<IPlaceDistanceMatrixRow[]> {
        const destinationStringList: string[] = destinations.map(destination => {
            return `${destination.latitude},${destination.longitude}`;
        });
        const destinationString = destinationStringList.join('|');
        const result: IDistanceMatrixResponse = await GeolocationService.callGoogle<IDistanceMatrixResponse>(
            GeolocationService.createGoogleMapsUri(GoogleApiRoute.DISTANCE_MATRIX, `?origins=${startLatitude},${startLongitude}&destinations=${destinationString}&region=NG&units=metric`)
        );
        return result.rows;
    }

    public async getDirections(startLatitude: number, startLongitude: number, endLatitude: number, endLongitude: number,
                               wayPoints?: {latitude: number, longitude: number}[]): Promise<IPlaceRoute[]> {
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

    public static getLGAAndStateFromPlace(place: IPlace): {lga?: string, state?: string} {
        if (!place || !place.address_components) return {lga: null, state: null};
        const lga: string = place.address_components.filter(addressComponent => addressComponent.types.includes('administrative_area_level_2'))[0]?.long_name;
        const state: string = place.address_components.filter(addressComponent => addressComponent.types.includes('administrative_area_level_1'))[0]?.long_name;
        return {lga, state};
    }

    private static async callGoogle<T extends IGoogleResponse>(url: string): Promise<T> {
        const result: IGoogleResponse = await request(url, {
            method: 'GET',
            timeout: 60000,
            json: true
        });
        if (result.status !== 'OK')
            console.warn(`Google result status not OK. Status is ${result.status}:`, result);
        return result as T;
    }
}
