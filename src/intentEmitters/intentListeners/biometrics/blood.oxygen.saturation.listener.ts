import { Logger } from '../../../common/logger';
import { GetPatientInfoService } from "../../../services/support.app.service";
import { createBloodOxygenSaturationInfoService, updateBloodOxygenSaturationInfoService } from "../../../services/biometrics/blood.oxygen.saturation.service";
import { getRequestOptions } from '../../../utils/helper';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

export const updateBloodOxygenSaturationInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Calling support app Service updateBloodOxygenSaturationInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.BloodOxygenSaturation) {
                reject("Missing required parameter PhoneNumber and/or BloodOxygenSaturation");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const BloodOxygenSaturation = eventObj.body.queryResult.parameters.BloodOxygenSaturation;
            let BloodOxygenSaturation_Unit = eventObj.body.queryResult.parameters.Unit;

            if (BloodOxygenSaturation_Unit === '') {
                BloodOxygenSaturation_Unit = '%';
            }

            console.log("phoneNumber, BloodOxygenSaturation and Unit", phoneNumber, BloodOxygenSaturation, BloodOxygenSaturation_Unit);

            let result;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);

            if (result.sendDff) {
                resolve(result.message);
                return;
            }

            const patientUserId = result.message[0].UserId;

            const accessToken = result.message[0].accessToken;

            const url = `${ReanBackendBaseUrl}clinical/biometrics/blood-oxygen-saturations/search?patientUserId=${patientUserId}`;

            // console.log("url", url)
            const options = getRequestOptions("rean_app");
            options.headers["authorization"] = `Bearer ${accessToken}`;
            options.headers["x-api-key"] = `${reancare_api_key}`;
            const resp = await needle("get", url, options);
            console.log("resppppppppppppppppppppppppp", resp.body);
            const bloodOxygenSaturationId = resp.body.Data.BloodOxygenSaturationRecords.Items[0].id;

            Logger.instance().log(`Fetching medication info for PatientUserId: ${patientUserId} & Access Token: ${accessToken}`);
            // eslint-disable-next-line max-len
            result = await updateBloodOxygenSaturationInfoService(patientUserId, accessToken, BloodOxygenSaturation, BloodOxygenSaturation_Unit, bloodOxygenSaturationId);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodOxygenSaturation Info Listener Error!");
            reject(error.message);
        }
    });
};

export const createBloodOxygenSaturationInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Calling support app Service createBloodOxygenSaturationInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            // Service Call
            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.BloodOxygenSaturation) {
                reject("Missing required parameter PhoneNumber and/or BloodOxygenSaturation");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const BloodOxygenSaturation = eventObj.body.queryResult.parameters.BloodOxygenSaturation;
            let BloodOxygenSaturation_Unit = eventObj.body.queryResult.parameters.Unit;

            if (BloodOxygenSaturation_Unit === '') {
                BloodOxygenSaturation_Unit = '%';
            }

            console.log("phoneNumber, BloodOxygenSaturation and Unit", phoneNumber, BloodOxygenSaturation, BloodOxygenSaturation_Unit);

            let result;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);
            console.log("Result", result);

            if (result.sendDff) {
                resolve(result.message);
                return;
            }

            const patientUserId = result.message[0].UserId;

            const accessToken = result.message[0].accessToken;

            console.log("accessToken", accessToken);

            // eslint-disable-next-line max-len
            result = await createBloodOxygenSaturationInfoService(patientUserId, accessToken, BloodOxygenSaturation, BloodOxygenSaturation_Unit);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BloodOxygenSaturation Info Listener Error!");
            reject(error.message);
        }
    });
};

