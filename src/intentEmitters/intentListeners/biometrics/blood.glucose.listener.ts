import { Logger } from '../../../common/logger';
import { GetPatientInfoService } from "../../../services/support.app.service";
import { createBloodGlucoseInfoService, updateBloodGlucoseInfoService } from "../../../services/biometrics/blood.glucose.service";
import { getRequestOptions } from '../../../utils/helper';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

export const updateBloodGlucoseInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling support app Service !!!!!!');
            console.log("Calling support app Service updateBloodGlucoseInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            // Service Call
            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.BloodGlucose_Amount) {
                reject("Missing required parameter PhoneNumber and/or BloodGlucose");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const BloodGlucose = eventObj.body.queryResult.parameters.BloodGlucose_Amount;
            const BloodGlucose_Unit = eventObj.body.queryResult.parameters.BloodGlucose_unit;

            console.log("phoneNumber, BloodGlucose and Unit", phoneNumber, BloodGlucose, BloodGlucose_Unit);

            let result;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);
            console.log("Result", result);

            if (result.sendDff) {
                resolve(result.message);
                return;
            }

            // if there is only one patient profile associated, get medication for the same
            const patientUserId = result.message[0].UserId;

            // console.log("patientUserId", patientUserId);
            const accessToken = result.message[0].accessToken;

            console.log("accessToken", accessToken);
            const url = `${ReanBackendBaseUrl}clinical/biometrics/blood-glucose/search?patientUserId=${patientUserId}`;

            // console.log("url", url)
            const options = getRequestOptions("rean_app");
            options.headers["authorization"] = `Bearer ${accessToken}`;
            options.headers["x-api-key"] = `${reancare_api_key}`;
            const resp = await needle("get", url, options);
            console.log("resppppppppppppppppppppppppp", resp.body);
            const bloodGlucoseId = resp.body.Data.BloodGlucoseRecords.Items[0].id;

            Logger.instance().log(`Fetching medication info for PatientUserId: ${patientUserId} & Access Token: ${accessToken}`);

            result = await
            // eslint-disable-next-line max-len
            updateBloodGlucoseInfoService(patientUserId, accessToken, BloodGlucose,BloodGlucose_Unit, bloodGlucoseId);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodGlucose Info Listener Error!");
            reject(error.message);
        }
    });
};

export const createBloodGlucoseInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling support app Service !!!!!!');
            console.log("Calling support app Service createBloodGlucoseInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            // Service Call
            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.BloodGlucose_Amount) {
                reject("Missing required parameter PhoneNumber and/or BloodGlucose");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const BloodGlucose = eventObj.body.queryResult.parameters.BloodGlucose_Amount;
            const BloodGlucose_Unit = eventObj.body.queryResult.parameters.BloodGlucose_unit;

            console.log("phoneNumber, BloodGlucose and Unit", phoneNumber, BloodGlucose, BloodGlucose_Unit);

            var result;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);
            console.log("Result", result);

            if (result.sendDff) {
                resolve(result.message);
                return;
            }

            // if there is only one patient profile associated, get medication for the same
            const patientUserId = result.message[0].UserId;

            // console.log("patientUserId", patientUserId);
            const accessToken = result.message[0].accessToken;

            console.log("accessToken", accessToken);

            result = await createBloodGlucoseInfoService(patientUserId, accessToken, BloodGlucose, BloodGlucose_Unit);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodGlucose Info Listener Error!");
            reject(error.message);
        }
    });
};

