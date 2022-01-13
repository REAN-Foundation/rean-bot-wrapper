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
export const updateBloodPressureInfoService = async (patientUserId, accessToken, Systolic,Diastolic,BloodPressure_Unit, bloodPressureId) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("PUT BloodPressureInfo API");
            Logger.instance().log(`PUT BloodPressureInfo API`);

            if (Systolic) {

                let unitmsg = '';
                if (BloodPressure_Unit === '') {
                    BloodPressure_Unit = 'mmHg';
                    unitmsg = `BloodPressure unit assumed to mmHg. `;

                }

                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-pressures/${bloodPressureId}`;

                const obj = {
                    "patientUserId" : patientUserId,
                    "Systolic"      : Systolic,
                    "Diastolic"     : Diastolic,
                    "Unit"          : BloodPressure_Unit
                };

                console.log("the obj is", obj);

                const response = await needle("put", apiUrl, obj, options);

                console.log("response", response);

                if (response.statusCode !== 200) {
                    reject("Failed to get response from API.");
                    return;
                }

                let remark = '';

                if (Systolic <= 120 && Diastolic < 80) {
                    remark = 'in normal range. Stay healthy!';
                } else if (Systolic <= 129 && Diastolic < 80) {
                    remark = 'in elevated range.';
                } else if (Systolic <= 139 || Diastolic <= 89) {
                    remark = 'high blood pressure stage 1.';
                } else if (Systolic < 180 || Diastolic < 120) {
                    remark = 'high blood pressure stage 2. Please consult your Doctor.';
                } else if (Systolic < 300 || Diastolic < 150) {
                    remark = 'high blood pressure stage 3. Please consult your Doctor.';
                }

                const dffMessage = `${unitmsg}Your updated BloodPressure Systolic: ${response.body.Data.BloodPressure.Systolic} Diastolic:${response.body.Data.BloodPressure.Diastolic} ${response.body.Data.BloodPressure.Unit} is ${remark}`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodPressure Info Service Error!");
            reject(error.message);
        }
    });
};

// eslint-disable-next-line max-len
export const createBloodPressureInfoService = async (patientUserId, accessToken, Systolic,Diastolic,BloodPressure_Unit) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("POST BloodPressureInfo API");
            Logger.instance().log(`POST BloodPressureInfo API`);

            if (Systolic) {

                let unitmsg = '';
                if (BloodPressure_Unit === '') {
                    BloodPressure_Unit = 'mmHg';
                    unitmsg = `BloodPressure unit assumed to mmHg. `;

                }

                const options = getRequestOptions("rean_app");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                options.headers["x-api-key"] = `${reancare_api_key}`;
                const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-pressures`;

                const obj = {
                    "PatientUserId" : patientUserId,
                    "Systolic"      : Systolic,
                    "Diastolic"     : Diastolic,
                    "Unit"          : BloodPressure_Unit,
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

                if (Systolic <= 120 && Diastolic < 80) {
                    remark = 'in normal range. Stay healthy!';
                } else if (Systolic <= 129 && Diastolic < 80) {
                    remark = 'in elevated range.';
                } else if (Systolic <= 139 || Diastolic <= 89) {
                    remark = 'high blood pressure stage 1.';
                } else if (Systolic < 180 || Diastolic < 120) {
                    remark = 'high blood pressure stage 2 Please consult your Doctor.';
                } else if (Systolic < 300 || Diastolic < 150) {
                    remark = 'high blood pressure stage 3. Please consult your Doctor.';
                }

                const dffMessage = `${unitmsg}Your newly added BloodPressure Systolic: ${response.body.Data.BloodPressure.Systolic} Diastolic:${response.body.Data.BloodPressure.Diastolic} ${response.body.Data.BloodPressure.Unit} is ${remark}`;

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });

            }
            
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodPressure Info Service Error!");
            reject(error.message);
        }
    });
};
