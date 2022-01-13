import { Logger } from '../../common/logger';
import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

export const createWeightInfoService = async (patientUserId, accessToken, BodyWeight,BodyWeight_Unit) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("POST WeightInfo API");
            Logger.instance().log(`POST WeightInfo API`);

            if (BodyWeight) {

                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-weights`;

                const obj = {
                    "PatientUserId" : patientUserId,
                    "BodyWeight"    : BodyWeight,
                    "Unit"          : BodyWeight_Unit,
                    "RecordDate"    : Date()
                };

                console.log("the obj is", obj);

                const response = await needle("post", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 201) {
                    reject("Failed to get response from API.");
                    return;
                }

                const dffMessage = `Your newly added BodyWeight is ${response.body.Data.BodyWeight.BodyWeight} ${response.body.Data.BodyWeight.Unit}.`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Weight Info Service Error!");
            reject(error.message);
        }
    });
};

export const updateWeightInfoService = async (patientUserId, accessToken, BodyWeight,BodyWeight_Unit, bodyWeightId) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("PUT WeightInfo API");
            Logger.instance().log(`PUT WeightInfo API`);

            if (BodyWeight) {

                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-weights/${bodyWeightId}`;

                const obj = {
                    "patientUserId" : patientUserId,
                    "BodyWeight"    : BodyWeight,
                    "Unit"          : BodyWeight_Unit
                };

                console.log("the obj is", obj);

                const response = await needle("put", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 200) {
                    reject("Failed to get response from API.");
                    return;
                }

                const dffMessage = `Your updated BodyWeight is ${response.body.Data.BodyWeight.BodyWeight} ${response.body.Data.BodyWeight.Unit}.`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Weight Info Service Error!");
            reject(error.message);
        }
    });
};
