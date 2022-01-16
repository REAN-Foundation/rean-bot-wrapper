import { Logger } from '../../../common/logger';
import { GetPatientInfoService } from "../../../services/support.app.service";
import { createBodyHeightInfoService, updateBodyHeightInfoService } from "../../../services/biometrics/body.height.service";
import { getRequestOptions } from '../../../utils/helper';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");

export const updateBodyHeightInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Calling support app Service updateBodyHeightInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            // Service Call
            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.BodyHeight) {
                reject("Missing required parameter PhoneNumber and/or BodyHeight");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            let BodyHeight = eventObj.body.queryResult.parameters.BodyHeight;
            let BodyHeight_Unit = eventObj.body.queryResult.parameters.BodyHeight_Unit;
            const Inch = eventObj.body.queryResult.parameters.Inch;

            const ten_digit = phoneNumber.substr(phoneNumber.length - 10);
            const country_code = phoneNumber.split(ten_digit)[0];

            if (BodyHeight_Unit === '') {
                if (country_code === '+91') {
                    BodyHeight_Unit = 'cm';
                } else if (country_code === '1') {
                    BodyHeight_Unit = 'ft';
                }
            }

            if (Inch !== '') {
                BodyHeight = BodyHeight + (Inch / 12);
            }

            console.log("phoneNumber, BodyHeight and Unit", phoneNumber, BodyHeight, BodyHeight_Unit);

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
            const url = `${ReanBackendBaseUrl}clinical/biometrics/body-heights/search?patientUserId=${patientUserId}`;

            const options = getRequestOptions("rean_app");
            options.headers["authorization"] = `Bearer ${accessToken}`;
            options.headers["x-api-key"] = `${reancare_api_key}`;
            const resp = await needle("get", url, options);
            console.log("resppppppppppppppppppppppppp", resp.body);
            const bodyHeightId = resp.body.Data.BodyHeightRecords.Items[0].id;

            Logger.instance().log(`Fetching medication info for PatientUserId: ${patientUserId} & Access Token: ${accessToken}`);

            result = await
            // eslint-disable-next-line max-len
            updateBodyHeightInfoService(patientUserId, accessToken, BodyHeight, BodyHeight_Unit, bodyHeightId);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BodyHeight Info Listener Error!");
            reject(error.message);
        }
    });
};

export const createBodyHeightInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling support app Service !!!!!!');
            console.log("Calling support app Service createBodyHeightInfo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

            // Service Call
            console.log("Request parameter", eventObj.body.queryResult.parameters);
            // eslint-disable-next-line max-len
            if (!eventObj.body.queryResult.parameters.PhoneNumber && !eventObj.body.queryResult.parameters.BodyHeight) {
                reject("Missing required parameter PhoneNumber and/or BodyHeight");
                return;
            }
            const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
            let BodyHeight = eventObj.body.queryResult.parameters.BodyHeight;
            let BodyHeight_Unit = eventObj.body.queryResult.parameters.BodyHeight_Unit;
            const Inch = eventObj.body.queryResult.parameters.Inch;

            const ten_digit = phoneNumber.substr(phoneNumber.length - 10);
            const country_code = phoneNumber.split(ten_digit)[0];

            if (BodyHeight_Unit === '') {
                if (country_code === '+91') {
                    BodyHeight_Unit = 'cm';
                } else if (country_code === '1') {
                    BodyHeight_Unit = 'ft';
                }
            }

            if (Inch !== '') {
                BodyHeight = BodyHeight + (Inch / 12);
            }

            console.log("phoneNumber, BodyHeight and Unit", phoneNumber, BodyHeight, BodyHeight_Unit);

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

            result = await createBodyHeightInfoService(patientUserId, accessToken, BodyHeight, BodyHeight_Unit);

            console.log("Inside listener: ", result);

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message);
            }

            resolve(result.message);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "BodyHeight Info Listener Error!");
            reject(error.message);
        }
    });
};

