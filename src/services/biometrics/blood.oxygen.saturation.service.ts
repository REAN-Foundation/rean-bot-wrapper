import { Logger } from '../../common/logger';
import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

let remark = '';
const getremark = function (BloodOxygenSaturation) {

    if (BloodOxygenSaturation >= 96) {
        remark = 'in normal range.';
    } else if (BloodOxygenSaturation < 96 && BloodOxygenSaturation >= 95) {
        remark = 'little low. We suggest please continue home monitoring.';
    } else if (BloodOxygenSaturation < 95 && BloodOxygenSaturation >= 93) {
        remark = 'low. Please consult your Doctor.';
    } else if (BloodOxygenSaturation < 93) {
        remark = 'very low. Please consult your Doctor.';
    }
    return remark;
};

// eslint-disable-next-line max-len
export const updateBloodOxygenSaturationInfoService = async (patientUserId, accessToken, BloodOxygenSaturation,BloodOxygenSaturation_Unit, bloodOxygenSaturationId) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("PUT BloodOxygenSaturationInfo API");
            console.log(`patientUserId is ${patientUserId}`);
            Logger.instance().log(`PUT BloodOxygenSaturationInfo API`);

            if (BloodOxygenSaturation) {

                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-oxygen-saturations/${bloodOxygenSaturationId}`;

                const obj = {
                    "PatientUserId"         : patientUserId,
                    "BloodOxygenSaturation" : BloodOxygenSaturation,
                    "Unit"                  : BloodOxygenSaturation_Unit
                };

                console.log("the obj is", obj);

                const response = await needle("put", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 200) {
                    reject("Failed to get response from API.");
                    return;
                }
                remark = getremark(BloodOxygenSaturation);

                const dffMessage = `Your updated BloodOxygenSaturation ${response.body.Data.BloodOxygenSaturation.BloodOxygenSaturation}${response.body.Data.BloodOxygenSaturation.Unit} is ${remark}`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodOxygenSaturation Info Service Error!");
            reject(error.message);
        }
    });
};

// eslint-disable-next-line max-len
export const createBloodOxygenSaturationInfoService = async (patientUserId, accessToken, BloodOxygenSaturation,BloodOxygenSaturation_Unit) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("POST BloodOxygenSaturationInfo API");
            console.log(`patientUserId is ${patientUserId}`);
            Logger.instance().log(`POST BloodOxygenSaturationInfo API`);

            if (BloodOxygenSaturation) {

                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-oxygen-saturations`;

                const obj = {
                    "PatientUserId"         : patientUserId,
                    "BloodOxygenSaturation" : BloodOxygenSaturation,
                    "Unit"                  : BloodOxygenSaturation_Unit,
                    "RecordDate"            : Date()
                };

                console.log("the obj is", obj);

                const response = await needle("post", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 201) {
                    reject("Failed to get response from API.");
                    return;
                }
                remark = getremark(BloodOxygenSaturation);
                
                const dffMessage = `Your newly added BloodOxygenSaturation ${response.body.Data.BloodOxygenSaturation.BloodOxygenSaturation}${response.body.Data.BloodOxygenSaturation.Unit} is ${remark}`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodOxygenSaturation Info Service Error!");
            reject(error.message);
        }
    });
};
