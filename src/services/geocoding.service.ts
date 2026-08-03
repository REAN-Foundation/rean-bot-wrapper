import axios from 'axios';
import { injectable } from 'tsyringe';
import { Logger } from '../common/logger';

export interface GeoCoordinates {
    lat: number;
    lng: number;
}

const GoogleGeocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
const GeocodeTimeoutInMilliseconds = 5000;

// Shown to the user for every failure mode; the cause is only distinguished in the logs.
const UnableToGeocodeMessage = "Unable to get location, try sharing your live location";

@injectable()
export class GeocodingService {

    async geocode(address: string): Promise<GeoCoordinates> {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            Logger.instance().log_error(
                "GOOGLE_MAPS_API_KEY is not set", 500, "Geocoding configuration error");
            throw new Error(UnableToGeocodeMessage);
        }

        let response = null;
        try {
            response = await axios.get(GoogleGeocodeUrl, {
                params : {
                    address : address,
                    key     : apiKey
                },
                timeout : GeocodeTimeoutInMilliseconds
            });
        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Google Geocoding API request failed");
            throw new Error(UnableToGeocodeMessage);
        }

        const data = response.data;
        const status = data ? data.status : undefined;

        if (status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                lat : location.lat,
                lng : location.lng
            };
        }

        this.logFailedStatus(status, data);
        throw new Error(UnableToGeocodeMessage);
    }

    private logFailedStatus(status: string, data: any) {
        const details = data ? data.error_message : undefined;
        if (status === 'REQUEST_DENIED' || status === 'INVALID_REQUEST') {

            // Bad, missing or restricted key, or a malformed request - needs a config fix.
            Logger.instance().log_error(
                `Google Geocoding API rejected the request: ${status} - ${details}`,
                500, "Geocoding configuration error");
        } else if (status === 'OVER_QUERY_LIMIT') {

            // Quota or billing cap reached - needs an ops response.
            Logger.instance().log_error(
                `Google Geocoding API quota exceeded - ${details}`, 429, "Geocoding quota error");
        } else if (status === 'ZERO_RESULTS') {
            Logger.instance().log_info("Google Geocoding API found no match for the given address");
        } else {
            Logger.instance().log_error(
                `Unexpected Google Geocoding API response: ${status} - ${details}`,
                500, "Geocoding error");
        }
    }

}
