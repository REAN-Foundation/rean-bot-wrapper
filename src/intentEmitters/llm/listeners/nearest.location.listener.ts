import { injectable, Lifecycle, scoped } from 'tsyringe';
import { BaseLLMListener } from '../base.llm.listener';
import { LLMEventObject, LLMListenerResponse } from '../../../refactor/interface/llm/llm.event.interfaces';
import { NearestLocation } from '../../../utils/find.nearest.centers';

/**
 * FindNearestLocation Listener
 *
 * Handles the findNearestLocation intent to find nearest medical centers
 * based on user's location (latlong, PIN code, or district name)
 */
@scoped(Lifecycle.ContainerScoped)
export class FindNearestLocationListener extends BaseLLMListener {

    readonly intentCode = 'findNearestLocation';

    /**
     * Handle the findNearestLocation intent
     *
     * Expects entity: Location (array)
     * Location can contain:
     * - latlong coordinates (e.g., "12.9716,77.5946" - comma-separated for Nominatim)
     * - PIN code/zipcode (e.g., "560001")
     * - District name (e.g., "Bangalore")
     */
    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        try {

            // Get the raw entity object (includes value, rawValue, confidence)
            const locationEntityObj = event.entities?.Location;

            if (!locationEntityObj) {
                return this.error('Please provide your location (PIN code, district name, or share location).');
            }

            this.log(`Location entity received: ${JSON.stringify(locationEntityObj)}`);

            // Extract the actual location value
            const locationValue = locationEntityObj.value;
            const locationRawValue = locationEntityObj.rawValue || '';

            // Parse location to extract the actual value
            const userLocationDetails = this.extractLocationValue(locationValue, locationRawValue);

            if (!userLocationDetails) {
                return this.error('Unable to process the location. Please provide a valid PIN code, district name, or location coordinates.');
            }

            this.log(`Parsed location details: ${userLocationDetails}`);

            // Resolve NearestLocation service from container
            const locationService = this.resolve(event, NearestLocation);

            // Find nearest locations
            const filterTags = {
                "severity" : "null"
            };
            const locationResponse = await locationService.findLocations(userLocationDetails, filterTags, null);

            // Format the response
            const message = await locationService.formatLoctionResponse(locationResponse);

            this.log(`Found ${locationResponse.length} nearby centers`);

            return this.success(message, {
                locations    : locationResponse.slice(0, 4),
                userLocation : userLocationDetails
            });

        } catch (error) {
            this.logError('Error finding nearest location', error);
            return this.error('Sorry, I encountered an error while finding the nearest centers. Please try again or call us at 1800-200-2211.');
        }
    }

    /**
     * Extract location value from various entity formats
     * Handles: Object (Dialogflow format), Array, String
     * @param locationEntity - The entity value
     * @param rawValue - The raw text value (used to detect type like "latlong")
     */
    private extractLocationValue(locationEntity: any, rawValue = ''): string | null {
        if (!locationEntity) {
            return null;
        }

        // Check rawValue to determine if this is lat/long
        const isLatLong = rawValue.toLowerCase().includes('latlong') ||
                         rawValue.toLowerCase().includes('location');

        // Scenario 1: Location is an object (Dialogflow @Location-v2 format)
        // Has properties: latlong, zipcode, District, etc.
        if (typeof locationEntity === 'object' && !Array.isArray(locationEntity)) {

            // Priority order: latlong > zipcode > District
            if (locationEntity.latlong) {
                return this.normalizeLocation(locationEntity.latlong);
            }
            if (locationEntity.zipcode) {
                return this.normalizeLocation(locationEntity.zipcode);
            }
            if (locationEntity.District) {
                return this.normalizeLocation(locationEntity.District);
            }
            if (locationEntity['admin-area']) {
                return this.normalizeLocation(locationEntity['admin-area']);
            }
            if (locationEntity.city) {
                return this.normalizeLocation(locationEntity.city);
            }
        }

        // Scenario 2: Location is an array
        if (Array.isArray(locationEntity)) {
            if (locationEntity.length === 0) {
                return null;
            }

            // Special case: Lat/long array [latitude, longitude]
            if (isLatLong && locationEntity.length === 2) {
                const lat = locationEntity[0];
                const long = locationEntity[1];
                const latLongString = `${lat},${long}`;
                this.log(`Detected lat/long array from rawValue: [${lat}, ${long}] -> ${latLongString}`);
                return latLongString; // Return directly, already in correct format
            }

            // If array contains objects, try to extract from first object
            if (typeof locationEntity[0] === 'object') {
                return this.extractLocationValue(locationEntity[0], rawValue);
            }

            // If array of strings/numbers, check first value
            const firstValue = locationEntity[0];
            if (typeof firstValue === 'string' || typeof firstValue === 'number') {
                const strValue = String(firstValue).trim();

                // If it looks complete (6 digits for PIN, coordinates, or name), use it
                if (strValue.length >= 4) {
                    return this.normalizeLocation(strValue);
                }

                // Otherwise, join array elements (handles split digits like ["5", "0", "0", "0", "8", "4"])
                return this.normalizeLocation(locationEntity.join(''));
            }
        }

        // Scenario 3: Location is a simple string or number
        if (typeof locationEntity === 'string' || typeof locationEntity === 'number') {
            return this.normalizeLocation(String(locationEntity));
        }

        return null;
    }

    /**
     * Normalize location string to the format expected by NearestLocation service (Nominatim)
     * Handles: PIN code, lat/long (comma-separated), district/city name, complete address
     */
    private normalizeLocation(locationValue: string | number): string | null {
        if (!locationValue) {
            return null;
        }

        const trimmed = String(locationValue).trim();

        if (!trimmed) {
            return null;
        }

        // Check if it's latlong (contains comma or pipe separator with numbers)
        // Format: "12.9716,77.5946" or "12.9716|77.5946"
        if (/^-?\d+\.?\d*[,|]-?\d+\.?\d*$/.test(trimmed)) {

            // Normalize to comma separator for Nominatim geocoding service
            return trimmed.replace('|', ',');
        }

        // Check if it's a PIN code (6 digits)
        if (/^\d{6}$/.test(trimmed)) {
            return trimmed;
        }

        // Otherwise, return as-is (district/city name or complete address)
        // NearestLocation service will handle geocoding
        return trimmed;
    }
}
