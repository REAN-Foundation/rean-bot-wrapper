import csv from 'csv-parser';
import streamifier from 'streamifier';
// import fetch from 'node-fetch';
import haversine from 'haversine-distance';
import { AwsS3manager } from '../services/aws.file.upload.service';
import { inject, injectable } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../services/set.client/client.environment.provider.service';

interface Center {
    latitude: number;
    longitude: number;
    postalAddress: string;
    centerName:string;
    severity: number;
    preferedCenter: string;
    priority: number;
    pincode: string;
  }
  
  interface Location {
    cityA: string;
    latitudeA: number;
    longitudeA: number;
  }
  
  interface Distance {
    [x: string]: any;
    postalAddress: string;
    centerName:string;
    distance: number;
    severity?: number;
    priority?: number;
    pincode?: string;
    relativeDistance?: number;
  }

@injectable()
export class NearestLocation {

    constructor(@inject(AwsS3manager) private awsS3manager?: AwsS3manager,
    @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService) {
    }

    async formatLoctionResponse(locationResponse) {
        try {
            const formattedResponse = `Here are the nearest centers you can visit:\n\n` +
            locationResponse.slice(0, 4).map((loc, i) => {
                const address = loc.postalAddress.replace(/\n/g, ', ');
                const distance = (parseFloat(loc.distance)).toFixed(1); // round to 1 decimal
                return `${i + 1}️⃣ *${loc.centerName}* \n📍 ${address}\n📏 Distance: ~${distance} km\n`;
            }).join('\n') +`\n✨ You may call ahead to confirm timings and availability before visiting.`;
            return formattedResponse;
        } catch (error) {
            console.log(error);
            throw new Error("Send location error");
        }

    }

    async readCsv(buffer: Buffer): Promise<Center[]> {
        return new Promise((resolve, reject) => {
            const centers: Center[] = [];
            const stream = streamifier.createReadStream(buffer);
    
            stream
                .pipe(csv())
                .on('data', (row) => {
                    centers.push({
                        latitude       : parseFloat(row['Latitude']),
                        longitude      : parseFloat(row['Longitude']),
                        centerName     : row['Center_Name'],
                        postalAddress  : row['Postal_Address'],
                        preferedCenter : row['Prefered_Center'],
                        severity       : parseFloat(row['Severity']),
                        priority       : parseFloat(row['Priority']),
                        pincode        : row['Pincode'],
                    });
                })
                .on('end', () => {
                    resolve(centers);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    async getLatLong(value: string): Promise<string> {
        const latlongCheck = value.split(':')[0];
        if (latlongCheck === 'latlong') {
            const latlongString = value.split(':')[1];
            return latlongString;
        } else {
            const address = value;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
                {
                    headers : {
                        "User-Agent" : "ReanBotWrapper/1.0 (services@reanfoundation.org)"
                    }
                }
            );
            const data = await response.json();
            if (data.length === 0) {
                throw new Error("Unable to get location, try sharing your live location");
            } else {
                const latitude = data[0].lat;
                const longitude = data[0].lon;
                const latlongString = `${latitude}|${longitude}`;
                return latlongString;
            }
        }
    }

    UserLocation(latlong_string: string):Location{
        const [latitude, longitude] = latlong_string.split('|').map(parseFloat);
        return {
            cityA      : 'user_location',
            latitudeA  : latitude,
            longitudeA : longitude,
        };
    }

    calculateDistance(locations_A: Location, locations_B: Center[]): Distance[] {
        return locations_B.map((location_B) => {
            const distance = haversine(
                {
                    latitude  : locations_A.latitudeA,
                    longitude : locations_A.longitudeA,
                },
                {
                    latitude  : location_B.latitude,
                    longitude : location_B.longitude,
                }
            );
            return {
                postalAddress  : location_B.postalAddress,
                centerName     : location_B.centerName,
                distance       : distance / 1000, // convert meters to kms
                severity       : location_B.severity,
                preferedCenter : location_B.preferedCenter,
                priority       : location_B.priority,
                pincode        : location_B.pincode,
            };
        });
    }

    sortCentersOnPriority(centers: Distance[]): Distance[] {
        centers.forEach((center) => {
            if (center.priority !== undefined && center.distance !== undefined) {
                center.relativeDistance = center.priority * center.distance;
            }
        });
        centers.sort((a, b) => (a.relativeDistance || 0) - (b.relativeDistance || 0));
        return centers;
    }

    async getFinalLocation(centers, threshold) {
        const prioritySortedCenters =  this.sortCentersOnPriority(centers);
        const preferredCenters = [];
        const nonPreferredCenters = prioritySortedCenters;
        if (threshold) {
            prioritySortedCenters.forEach(center => {
                if (center.Distance !== undefined){
                    if (center.Distance <= threshold && center.Prefered_Center === "Yes") {
                        preferredCenters.push(center);
                    }
                    else {
                        nonPreferredCenters.push(center);
                    }
                }
            });
        }

        // Combine preferred centers at the top with the sorted non-preferred centers
        const finalCenters = [...preferredCenters, ...nonPreferredCenters];
    
        return finalCenters;
    }

    async filterCentersOnTags(filterTags,centersDetails)
    {
        try {
            let filteredCentersDetails = centersDetails;
            if (filterTags){
                if (filterTags["severityGrade"]){
                    filteredCentersDetails = centersDetails.filter(
                        (center) => center.severity >= filterTags["severityGrade"]
                    );
                }
            }

            return filteredCentersDetails;
        } catch (error) {
            console.log("error is with filtering centers",error);
        }
    }

    async findLocations(userLocationDetails: string, filteringTags, threshold = 5){
        try {
            const latlongString = await this.getLatLong(userLocationDetails);
            const userLocation = this.UserLocation(latlongString);
            const fileKey = this.clientEnvironment.getClientEnvironmentVariable("CENTER_LOCATION_FILE_KEY");
            const csvFile = await this.awsS3manager.getFile(fileKey);
            const centersDetails = await this.readCsv(csvFile.Body);
            const FilteredCenters = await this.filterCentersOnTags(filteringTags,centersDetails);
            const centersWithDistance = this.calculateDistance(userLocation, FilteredCenters);
            centersWithDistance.sort((a, b) => a.distance - b.distance);
            const sortedCenters = await this.getFinalLocation(centersWithDistance,threshold);
            return sortedCenters.slice(0, 4);
        } catch (error) {
            console.error(error);
            return [];
        }
    }

}
