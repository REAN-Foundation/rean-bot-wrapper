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
export const updateBodyTemperatureInfoService = async (patientUserId, accessToken, BodyTemperature,BodyTemperature_Unit, bodyTemperatureId) => {
    return new Promise(async (resolve, reject) => {
        try {

            let unitmsg = '';
            if (BodyTemperature_Unit === '') {
                
                if (BodyTemperature < 50) {
                    BodyTemperature_Unit = '°C';
                    unitmsg = `Temperature unit assumed to °C. `;
                } else {
                    BodyTemperature_Unit = '°F';
                    unitmsg = `Temperature unit assumed to °F. `;
                }

            }
            console.log("PUT BodyTemperatureInfo API");
            Logger.instance().log(`PUT BodyTemperatureInfo API`);

            const options = getRequestOptions("rean_app");
            options.headers["authorization"] = `Bearer ${accessToken}`;
            options.headers["x-api-key"] = `${reancare_api_key}`;
            const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-temperatures/${bodyTemperatureId}`;

            const obj = {
                "PatientUserId"   : patientUserId,
                "BodyTemperature" : BodyTemperature,
                "Unit"            : BodyTemperature_Unit
            };

            console.log("the obj is", obj);

            const response = await needle("put", apiUrl, obj, options);

            console.log("response", response);

            if (response.statusCode !== 200) {
                reject("Failed to get response from API.");
                return;
            }

            let remark = '';

            if (BodyTemperature_Unit === '°F') {
                    
                if (BodyTemperature < 95) {
                    remark = 'in low range.';
                } else if (BodyTemperature < 99 && BodyTemperature > 95) {
                    remark = 'in normal range. Stay healthy!';
                } else if (BodyTemperature < 100 && BodyTemperature >= 99) {
                    remark = 'mild fever.';
                } else if (BodyTemperature < 102 && BodyTemperature >= 100) {
                    remark = 'high. Please consult your Doctor.';
                } else if (BodyTemperature >= 102) {
                    remark = 'very high. Please consult your Doctor.';
                }
            }

            if (BodyTemperature_Unit === '°C') {
                    
                if (BodyTemperature < 37) {
                    remark = 'in low range.';
                } else if (BodyTemperature <= 38) {
                    remark = 'in normal range. Stay healthy!';
                } else if (BodyTemperature < 39) {
                    remark = 'mild fever.';
                } else if (BodyTemperature < 42) {
                    remark = 'very high. Please consult your Doctor.';
                }
            }

            const dffMessage = `${unitmsg}Your updated BodyTemperature ${response.body.Data.BodyTemperature.BodyTemperature} ${response.body.Data.BodyTemperature.Unit} is ${remark}`;

            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            resolve({ sendDff: true, message: data });

        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BodyTemperature Info Service Error!");
            reject(error.message);
        }
    });
};

// eslint-disable-next-line max-len
export const createBodyTemperatureInfoService = async (patientUserId, accessToken, BodyTemperature,BodyTemperature_Unit) => {
    return new Promise(async (resolve, reject) => {
        try {

            let unitmsg = '';
            if (BodyTemperature_Unit === '') {
                
                if (BodyTemperature < 50) {
                    BodyTemperature_Unit = '°C';
                    unitmsg = `Temperature unit assumed to °C. `;
                } else {
                    BodyTemperature_Unit = '°F';
                    unitmsg = `Temperature unit assumed to °F. `;
                }

            }
            console.log("POST BodyTemperatureInfo API");
            Logger.instance().log(`POST BodyTemperatureInfo API`);

            const options = getRequestOptions("rean_app");
            options.headers["authorization"] = `Bearer ${accessToken}`;
            options.headers["x-api-key"] = `${reancare_api_key}`;
            const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-temperatures`;

            const obj = {
                "PatientUserId"   : patientUserId,
                "BodyTemperature" : BodyTemperature,
                "Unit"            : BodyTemperature_Unit,
                "RecordDate"      : Date()
            };

            console.log("the obj is", obj);

            const response = await needle("post", apiUrl, obj, options);

            console.log("response", response);

            if (response.statusCode !== 201) {
                reject("Failed to get response from API.");
                return;
            }

            let remark = '';

            if (BodyTemperature_Unit === '°F') {
                    
                if (BodyTemperature < 95) {
                    remark = 'in low range.';
                } else if (BodyTemperature < 99 && BodyTemperature > 95) {
                    remark = 'in normal range. Stay healthy!';
                } else if (BodyTemperature < 100 && BodyTemperature >= 99) {
                    remark = 'mild fever.';
                } else if (BodyTemperature < 102 && BodyTemperature >= 100) {
                    remark = 'high. Please consult your Doctor.';
                } else if (BodyTemperature >= 102) {
                    remark = 'very high. Please consult your Doctor.';
                }
            }

            if (BodyTemperature_Unit === '°C') {
                    
                if (BodyTemperature < 37) {
                    remark = 'in low range.';
                } else if (BodyTemperature <= 38) {
                    remark = 'in normal range. Stay healthy!';
                } else if (BodyTemperature < 39) {
                    remark = 'mild fever.';
                } else if (BodyTemperature < 42) {
                    remark = 'very high. Please consult your Doctor.';
                }
            }

            const dffMessage = `${unitmsg}Your newly added BodyTemperature ${response.body.Data.BodyTemperature.BodyTemperature} ${response.body.Data.BodyTemperature.Unit} is ${remark}`;

            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            resolve({ sendDff: true, message: data });

        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BodyTemperature Info Service Error!");
            reject(error.message);
        }
    });
};
