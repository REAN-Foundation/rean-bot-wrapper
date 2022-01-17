import { Logger } from '../../../common/logger';
import { GetPatientInfoService } from "../../../services/support.app.service";
import { createBloodPressureInfoService, updateBloodPressureInfoService } from "../../../services/biometrics/blood.pressure.service";
import { getRequestOptions } from '../../../utils/helper';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

export const updateBloodPressureInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Calling support app Service updateBloodPressureInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.Systolic) {
                reject("Missing required parameter PhoneNumber and/or BloodPressure.");
                return;
            }
            const { phoneNumber, Systolic, Diastolic, BloodPressure_Unit } = checkEntry(eventObj);

            let result;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);

            if (result.sendDff) {
                resolve(result.message);
                return;
            }

            const patientUserId = result.message[0].UserId;
            console.log("patient Iddddddddddd", patientUserId);

            const accessToken = result.message[0].accessToken;

            const url = `${ReanBackendBaseUrl}clinical/biometrics/blood-pressures/search?patientUserId=${patientUserId}`;

            const options = getRequestOptions();
            options.headers["authorization"] = `Bearer ${accessToken}`;
            options.headers["x-api-key"] = `${reancare_api_key}`;
            const resp = await needle("get", url, options);
            console.log("resppppppppppppppppppppppppp", resp.body);
            const bloodPressureId = resp.body.Data.BloodPressureRecords.Items[0].id;

            Logger.instance().log(`Fetching medication info for PatientUserId: ${patientUserId} & Access Token: ${accessToken}`);

            result = await
            
            // eslint-disable-next-line max-len
            updateBloodPressureInfoService(patientUserId, accessToken, Systolic,Diastolic,BloodPressure_Unit, bloodPressureId);

            giveResponse(result, reject, resolve);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodPressureUpdate Info Listener Error!");
            reject(error.message);
        }
    });
};

export const createBloodPressureInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Calling support app Service createBloodPressureInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            // Service Call
            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.Systolic) {
                reject("Missing required parameter PhoneNumber and/or BloodPressure");
                return;
            }
            const { phoneNumber, Systolic, Diastolic, BloodPressure_Unit } = checkEntry(eventObj);

            let result;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);
            console.log("Result", result);

            if (result.sendDff) {
                resolve(result.message);
                return;
            }

            const patientUserId = result.message[0].UserId;
            console.log("patient Idddddddddddd", patientUserId);

            const accessToken = result.message[0].accessToken;

            // eslint-disable-next-line max-len
            result = await createBloodPressureInfoService(patientUserId, accessToken, Systolic,Diastolic,BloodPressure_Unit);

            giveResponse(result, reject, resolve);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodPressureCreate Info Listener Error!");
            reject(error.message);
        }
    });
};
function giveResponse(result: any, reject: (reason?: any) => void, resolve: (value: unknown) => void) {
    console.log("Inside listener: ", result);

    if (!result.sendDff) {
        console.log("I am failed");
        reject(result.message);
    }

    resolve(result.message);
}

function checkEntry(eventObj: any) {
    const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
    const Systolic = eventObj.body.queryResult.parameters.Systolic;
    const Diastolic = eventObj.body.queryResult.parameters.Diastolic;
    const BloodPressure_Unit = eventObj.body.queryResult.parameters.Unit;

    console.log("phoneNumber, Systole, Diastole and Unit", phoneNumber, Systolic, Diastolic, BloodPressure_Unit);
    return { phoneNumber, Systolic, Diastolic, BloodPressure_Unit };
}

