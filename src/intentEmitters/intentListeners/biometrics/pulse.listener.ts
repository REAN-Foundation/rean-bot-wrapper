import { Logger } from '../../../common/logger';
import { GetPatientInfoService } from "../../../services/support.app.service";
import { createPulseInfoService, updatePulseInfoService } from "../../../services/biometrics/pulse.service";
import { getRequestOptions } from '../../../utils/helper';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

export const updatePulseInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Calling support app Service updatePulseInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.Pulse) {
                reject("Missing required parameter PhoneNumber and/or Pulse");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const Pulse = eventObj.body.queryResult.parameters.Pulse;
            let Pulse_Unit = eventObj.body.queryResult.parameters.Pulse_Unit;

            if (Pulse_Unit === '') {
                Pulse_Unit = 'bpm';
            }

            console.log("phoneNumber, Pulse and Unit", phoneNumber, Pulse, Pulse_Unit);

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
            const url = `${ReanBackendBaseUrl}clinical/biometrics/pulse/search?patientUserId=${patientUserId}`;

            const options = getRequestOptions("rean_app");
            options.headers["authorization"] = `Bearer ${accessToken}`;
            options.headers["x-api-key"] = `${reancare_api_key}`;
            const resp = await needle("get", url, options);
            const pulseId = resp.body.Data.PulseRecords.Items[0].id;

            Logger.instance().log(`Fetching medication info for PatientUserId: ${patientUserId} & Access Token: ${accessToken}`);

            result = await updatePulseInfoService(patientUserId, accessToken, Pulse, Pulse_Unit, pulseId);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Pulse Info Listener Error!");
            reject(error.message);
        }
    });
};

export const createPulseInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Calling support app Service createPulseInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.Pulse) {
                reject("Missing required parameter PhoneNumber and/or Pulse");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const Pulse = eventObj.body.queryResult.parameters.Pulse;
            let Pulse_Unit = eventObj.body.queryResult.parameters.Pulse_Unit;

            if (Pulse_Unit === '') {
                Pulse_Unit = 'bpm';
            }

            console.log("phoneNumber, Pulse and Unit", phoneNumber, Pulse, Pulse_Unit);

            let result;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);
            console.log("Result", result);

            if (result.sendDff) {
                resolve(result.message);
                return;
            }

            const patientUserId = result.message[0].UserId;

            const accessToken = result.message[0].accessToken;

            // eslint-disable-next-line max-len
            result = await createPulseInfoService(patientUserId, accessToken, Pulse, Pulse_Unit);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Pulse Info Listener Error!");
            reject(error.message);
        }
    });
};
