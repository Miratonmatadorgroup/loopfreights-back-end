

export interface IGoogleResponse {
    status: string;
}
export interface IPlacePredictionResponse extends IGoogleResponse {
    predictions: IPlacePrediction[];
}
export interface IPlaceDetailResponse extends IGoogleResponse {
    result: IPlace;
}
export interface IReverseGeocodeResponse extends IGoogleResponse {
    results: IPlace[];
}
export interface IPlaceDirectionsResponse extends IGoogleResponse {
    geocoded_waypoints: IPlaceGeoCodedWaypoint[];
    routes: IPlaceRoute[];
}
export interface IDistanceMatrixResponse extends IGoogleResponse {
    origin_addresses: string[];
    destination_addresses: string[];
    rows: IPlaceDistanceMatrixRow[];
}

export interface IPlaceMatchedSubstring {
    length: number;
    offset: number;
}
export interface IPlaceTerm {
    offset: number;
    value: string;
}
export interface IPlaceStructuredFormatting {
    main_text: string;
    main_text_matched_substrings: IPlaceMatchedSubstring[];
    secondary_text: string;
}
export interface IPlaceAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}
export interface IPlaceLocation {
    lat: number;
    lng: number;
}
export interface IPlaceDuration {
    value: number;
    text: string;
}
export interface IPlaceDistance {
    value: number;
    text: string;
}

export interface IPlacePrediction {
    description: string;
    distance_meters: string;
    id: string;
    type: string[];
    place_id: string;
    reference: string;
    matched_substrings: IPlaceMatchedSubstring[];
    structured_formatting: IPlaceStructuredFormatting[];
    terms: IPlaceTerm[];
}
export interface IPlace {
    html_attributions: string;
    address_components: IPlaceAddressComponent[];
    adr_address: string;
    formatted_address: string;
    formatted_phone_number: string;
    geometry: {
        location: IPlaceLocation;
        viewport: {
            northeast: IPlaceLocation;
            southwest: IPlaceLocation;
        };
    };
    icon: string;
    id: string;
    name: string;
    place_id: string;
    rating: string;
    reference: string;
    types: string[];
    url: string;
    utc_offset: number;
    vicinity: string;
    website: string;
}
export interface IPlaceGeoCodedWaypoint {
    geocoder_status: string;
    place_id: string;
    types: string[];
}
export interface IPlaceRoute {
    summary: string;
    legs: IPlaceLeg[];
    overview_polyline: IPlaceOverViewPolyline
}

export interface IPlaceOverViewPolyline {
    points: string;
}
export interface IPlaceLeg {
    steps: IPlaceStep[];
    copyrights: string;
    overview_polyline: IPlaceOverViewPolyline;
    warnings: string[];
    waypoint_order: number;
    duration: IPlaceDuration;
    distance: IPlaceDistance;
    bounds: {
        southwest: IPlaceLocation;
        northeast: IPlaceLocation;
    };
}

export interface IPlaceStep {
    travel_mode: string;
    start_location: IPlaceLocation;
    end_location: IPlaceLocation;
    start_address: string;
    end_address: string;
    polyline: IPlacePolyline;
    duration: IPlaceDuration;
    distance: IPlaceDistance;
    html_instructions: string;
}

export interface IPlacePolyline {
    points: string;
}

export interface IPlaceDistanceMatrixRow {
    elements: IPlaceDistanceMatrixElement[];
}

export interface IPlaceDistanceMatrixElement {
    status: string;
    duration: IPlaceDuration;
    distance: IPlaceDistance;
}
