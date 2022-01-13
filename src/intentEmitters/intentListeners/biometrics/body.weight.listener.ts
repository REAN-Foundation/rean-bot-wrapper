import { Logger } from '../../../common/logger';
import { GetPatientInfoService } from "../../../services/support.app.service";
import { createWeightInfoService, updateWeightInfoService } from "../../../services/biometrics/body.weight.service";
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { getRequestOptions } from '../../../utils/helper';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

export const createWeightInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling support app Service !!!!!!');
            console.log("Calling support app Service createWeightInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            // Service Call
            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.Weight_Amount) {
                reject("Missing required parameter PhoneNumber and/or BodyWeight");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const BodyWeight = eventObj.body.queryResult.parameters.Weight_Amount;
            let BodyWeight_Unit = eventObj.body.queryResult.parameters.Weight_unit;

            const ten_digit = phoneNumber.substr(phoneNumber.length - 10);
            const country_code = phoneNumber.split(ten_digit)[0];

            if (BodyWeight_Unit === '') {
                if (country_code === '+91') {
                    BodyWeight_Unit = 'Kg';
                } else if (country_code === '1') {
                    BodyWeight_Unit = 'lb';
                }
            }

            console.log("phoneNumber, BodyWeigh and Unit", phoneNumber, BodyWeight, BodyWeight_Unit);

            let result;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);
            console.log("Result", result);

            if (result.sendDff) {
                resolve(result.message);
                return;
            }

            // if there is only one patient profile associated, get medication for the same
            const patientUserId = result.message[0].UserId;

            const accessToken = result.message[0].accessToken;

            result = await createWeightInfoService(patientUserId, accessToken, BodyWeight,BodyWeight_Unit);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Weight Info Listener Error!");
            reject(error.message);
        }
    });
};

export const updateWeightInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling support app Service !!!!!!');
            console.log("Calling support app Service updateWeightInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            // Service Call
            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.Weight_Amount) {
                reject("Missing required parameter PhoneNumber and/or BodyWeight");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            const BodyWeight = eventObj.body.queryResult.parameters.Weight_Amount;
            let BodyWeight_Unit = eventObj.body.queryResult.parameters.Weight_unit;

            const ten_digit = phoneNumber.substr(phoneNumber.length - 10);
            const country_code = phoneNumber.split(ten_digit)[0];

            if (BodyWeight_Unit === '') {
                if (country_code === '+91') {
                    BodyWeight_Unit = 'Kg';
                } else if (country_code === '1') {
                    BodyWeight_Unit = 'lb';
                }
            }

            console.log("phoneNumber, BodyWeigh and Unit", phoneNumber, BodyWeight, BodyWeight_Unit);

            let result;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);
            console.log("Result", result);

            if (result.sendDff) {
                resolve(result.message);
                return;
            }

            // if there is only one patient profile associated, get medication for the same
            const patientUserId = result.message[0].UserId;

            const accessToken = result.message[0].accessToken;

            const url = `${ReanBackendBaseUrl}clinical/biometrics/body-weights/search?patientUserId=${patientUserId}`;

            const options = getRequestOptions();
            options.headers["authorization"] = `Bearer ${accessToken}`;
            options.headers["x-api-key"] = `${reancare_api_key}`;
            const resp = await needle("get", url, options);
            console.log("resppppppppppppppppppppppppp", resp.body);
            const bodyWeightId = resp.body.Data.BodyWeightRecords.Items[0].id;

            Logger.instance().log(`Fetching medication info for PatientUserId: ${patientUserId} & Access Token: ${accessToken}`);

            // eslint-disable-next-line max-len
            result = await updateWeightInfoService(patientUserId, accessToken, BodyWeight,BodyWeight_Unit, bodyWeightId);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Weight Info Listener Error!");
            reject(error.message);
        }
    });
};
