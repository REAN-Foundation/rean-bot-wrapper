import { Logger } from '../../common/logger';
import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

// eslint-disable-next-line max-len
export const updateBodyHeightInfoService = async (patientUserId, accessToken, BodyHeight,BodyHeight_Unit, bodyHeightId) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`PUT BodyHeightInfo API`);

            if (BodyHeight) {

                const options = getOptions(accessToken);
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-heights/${bodyHeightId}`;

                const obj = {
                    "PatientUserId" : patientUserId,
                    "BodyHeight"    : BodyHeight,
                    "Unit"          : BodyHeight_Unit
                };

                console.log("the obj is", obj);

                const response = await needle("put", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 200) {
                    reject("Failed to get update response from API.");
                    return;
                }

                const dffMessage = `Your updated BodyHeight is ${response.body.Data.BodyHeight.BodyHeight} ${response.body.Data.BodyHeight.Unit}.`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BodyHeight Info Service Error!");
            reject(error.message);
        }
    });
};

// eslint-disable-next-line max-len
export const createBodyHeightInfoService = async (patientUserId, accessToken, BodyHeight,BodyHeight_Unit) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`POST BodyHeightInfo API`);

            if (BodyHeight) {

                const options = getOptions(accessToken);
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-heights`;

                const obj = {
                    "PatientUserId" : patientUserId,
                    "BodyHeight"    : BodyHeight,
                    "Unit"          : BodyHeight_Unit,
                    "RecordDate"    : Date()
                };

                const response = await needle("post", apiUrl, obj, options);

                if (response.statusCode !== 201) {
                    reject("Failed to get create response from API.");
                    return;
                }

                const dffMessage = `Your newly added BodyHeight is ${response.body.Data.BodyHeight.BodyHeight} ${response.body.Data.BodyHeight.Unit}.`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BodyHeight Info Service Error!");
            reject(error.message);
        }
    });
};
function getOptions(accessToken: any) {
    const options = getRequestOptions("rean_app");
    options.headers["authorization"] = `Bearer ${accessToken}`;
    options.headers["x-api-key"] = `${reancare_api_key}`;
    return options;
}

