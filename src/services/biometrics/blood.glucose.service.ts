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
const getremark = function (BloodGlucose) {

    if (BloodGlucose < 53) {
        remark = 'very low. Please consult your doctor.';
    } else if (BloodGlucose < 70 && BloodGlucose >= 53) {
        remark = 'low. We suggest please continue home monitoring.';
    } else if (BloodGlucose < 125 && BloodGlucose >= 70) {
        remark = 'in normal range. Stay healthy!';
    } else if (BloodGlucose < 200 && BloodGlucose >= 125) {
        remark = 'high. Please consult your Doctor.';
    } else if (BloodGlucose >= 200) {
        remark = 'very high. Please consult your Doctor.';
    }
    return remark;
};

// eslint-disable-next-line max-len
export const updateBloodGlucoseInfoService = async (patientUserId, accessToken, BloodGlucose,BloodGlucose_Unit, bloodGlucoseId) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`PUT BloodGlucoseInfo API`);

            if (BloodGlucose) {

                let unitmsg = '';
                if (BloodGlucose_Unit === '') {
                    BloodGlucose_Unit = 'mg/dL';
                    unitmsg = `BloodGlucose unit assumed to mg/dL. `;

                }
                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-glucose/${bloodGlucoseId}`;

                const obj = {
                    "patientUserId" : patientUserId,
                    "BloodGlucose"  : BloodGlucose,
                    "Unit"          : BloodGlucose_Unit
                };

                console.log("the obj is", obj);

                const response = await needle("put", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 200) {
                    reject("Failed to get response from API.");
                    return;
                }

                remark = getremark(BloodGlucose);

                const dffMessage = `${unitmsg}Your updated BloodGlucose ${response.body.Data.BloodGlucose.BloodGlucose} ${response.body.Data.BloodGlucose.Unit} is ${remark}`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodGlucose Info Service Error!");
            reject(error.message);
        }
    });
};

export const createBloodGlucoseInfoService = async (patientUserId, accessToken, BloodGlucose,BloodGlucose_Unit) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("POST BloodGlucoseInfo API");
            Logger.instance().log(`POST BloodGlucoseInfo API`);

            if (BloodGlucose) {

                let unitmsg = '';
                if (BloodGlucose_Unit === '') {
                    BloodGlucose_Unit = 'mg/dL';
                    unitmsg = `BloodGlucose unit assumed to mg/dL. `;

                }

                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-glucose`;

                const obj = {
                    "PatientUserId" : patientUserId,
                    "BloodGlucose"  : BloodGlucose,
                    "Unit"          : BloodGlucose_Unit,
                    "RecordDate"    : Date()
                };

                console.log("the obj is", obj);

                const response = await needle("post", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 201) {
                    reject("Failed to get response from API.");
                    return;
                }

                remark = getremark(BloodGlucose);
                
                const dffMessage = `${unitmsg}Your newly added BloodGlucose ${response.body.Data.BloodGlucose.BloodGlucose} ${response.body.Data.BloodGlucose.Unit} is ${remark}`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodGlucose Info Service Error!");
            reject(error.message);
        }
    });
};
