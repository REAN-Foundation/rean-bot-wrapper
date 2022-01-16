import { Logger } from '../../../common/logger';
import { GetPatientInfoService } from "../../../services/support.app.service";
import { createBodyTemperatureInfoService, updateBodyTemperatureInfoService } from "../../../services/biometrics/body.temperature.service";
import { getRequestOptions } from '../../../utils/helper';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

export const updateBodyTemperatureInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling support app Service !!!!!!');
            console.log("Calling support app Service updateBodyTemperatureInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.BodyTemperature) {
                reject("Missing required parameter PhoneNumber and/or BodyTemperature");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const BodyTemperature = eventObj.body.queryResult.parameters.BodyTemperature;
            const BodyTemperature_Unit = eventObj.body.queryResult.parameters.Unit;

            console.log("phoneNumber, BodyTemperature and Unit", phoneNumber, BodyTemperature, BodyTemperature_Unit);

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
            const url = `${ReanBackendBaseUrl}clinical/biometrics/body-temperatures/search?patientUserId=${patientUserId}`;

            const options = getRequestOptions("rean_app");
            options.headers["authorization"] = `Bearer ${accessToken}`;
            options.headers["x-api-key"] = `${reancare_api_key}`;
            const resp = await needle("get", url, options);
            console.log("resppppppppppppppppppppppppp", resp.body);
            const bodyTemperatureId = resp.body.Data.BodyTemperatureRecords.Items[0].id;

            Logger.instance().log(`Fetching medication info for PatientUserId: ${patientUserId} & Access Token: ${accessToken}`);

            // eslint-disable-next-line max-len
            result = await updateBodyTemperatureInfoService(patientUserId, accessToken, BodyTemperature,BodyTemperature_Unit, bodyTemperatureId);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BodyTemperature Info Listener Error!");
            reject(error.message);
        }
    });
};

export const createBodyTemperatureInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Calling support app Service createBodyTemperatureInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            console.log("Request parameter", eventObj.body.queryResult.parameters);

            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.BodyTemperature) {
                reject("Missing required parameter PhoneNumber and/or BodyTemperature");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const BodyTemperature = eventObj.body.queryResult.parameters.BodyTemperature;
            const BodyTemperature_Unit = eventObj.body.queryResult.parameters.Unit;

            console.log("phoneNumber, BodyTemperature and Unit", phoneNumber, BodyTemperature, BodyTemperature_Unit);

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
            result = await createBodyTemperatureInfoService(patientUserId, accessToken, BodyTemperature,BodyTemperature_Unit);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BodyTemperature Info Listener Error!");
            reject(error.message);
        }
    });
};
