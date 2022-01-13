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
export const updatePulseInfoService = async (patientUserId, accessToken, Pulse, Pulse_Unit, pulseId) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("PUT PulseInfo API");
            Logger.instance().log(`PUT PulseInfo API`);

            if (Pulse) {

                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/Pulse/${pulseId}`;

                const obj = {
                    "patientUserId" : patientUserId,
                    "Pulse"         : Pulse,
                    "Unit"          : Pulse_Unit
                };

                console.log("the obj is", obj);

                const response = await needle("put", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 200) {
                    reject("Failed to get response from API.");
                    return;
                }

                let remark = '';

                if (Pulse <= 100 && Pulse > 40) {
                    remark = 'in normal range. Stay healthy!';
                } else if (Pulse <= 109 && Pulse > 100) {
                    remark = 'little high. We suggest please continue home monitoring.';
                } else if (Pulse <= 130 && Pulse > 109) {
                    remark = 'high. Please consult your Doctor.';
                } else if (Pulse > 130) {
                    remark = 'very high. Please consult your Doctor.';
                }

                const dffMessage = `Your updated Pulse ${response.body.Data.Pulse.Pulse} ${response.body.Data.Pulse.Unit} is ${remark}`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Pulse Info Service Error!");
            reject(error.message);
        }
    });
};

// eslint-disable-next-line max-len
export const createPulseInfoService = async (patientUserId, accessToken, Pulse, Pulse_Unit) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("POST PulseInfo API");
            Logger.instance().log(`POST PulseInfo API`);

            if (Pulse) {

                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/Pulse`;

                const obj = {
                    "PatientUserId" : patientUserId,
                    "Pulse"         : Pulse,
                    "Unit"          : Pulse_Unit,
                    "RecordDate"    : Date()
                };

                console.log("the obj is", obj);

                const response = await needle("post", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 201) {
                    reject("Failed to get response from API.");
                    return;
                }

                let remark = '';

                if (Pulse <= 100 && Pulse > 40) {
                    remark = 'in normal range. Stay healthy!';
                } else if (Pulse <= 109 && Pulse > 100) {
                    remark = 'little high. We suggest please continue home monitoring.';
                } else if (Pulse <= 130 && Pulse > 109) {
                    remark = 'high. Please consult your Doctor.';
                } else if (Pulse > 130) {
                    remark = 'very high. Please consult your Doctor.';
                }

                const dffMessage = `Your newly added Pulse ${response.body.Data.Pulse.Pulse} ${response.body.Data.Pulse.Unit} is ${remark}`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Pulse Info Service Error!");
            reject(error.message);
        }
    });
};
