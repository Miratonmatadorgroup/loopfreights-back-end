import {IBaseInterface} from "./baseInterface";
import {IDistanceMatrix} from "./distanceMatrix";

export interface IBaseLocation extends IBaseInterface {
    latitude: number;
    longitude: number;
    address?: string;
    bearing?: number;
    type?: string;
    coordinates?: number[];
    positionsPolyline?: string;
    distanceMatrix?: IDistanceMatrix;
}
