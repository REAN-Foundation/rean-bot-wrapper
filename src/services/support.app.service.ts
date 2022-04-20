import { Logger } from '../common/logger';
import { getRequestOptions } from '../utils/helper';
import needle from "needle";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';

// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);

export class GetPatientInfoService{

    async getPatientsByPhoneNumberservice (eventObj) {
        return new Promise(async (resolve, reject) => {
            try {
                Logger.instance().log(`Get Patient Info API ${clientEnvironmentProviderService.getClientName()}`);

                const b = eventObj.body.session;
                let phoneNumber = b.split("/", 5)[4];
                if (!phoneNumber) {
                    reject("Missing required parameter PhoneNumber");
                    return;
                }

                if (phoneNumber.length > 10 && phoneNumber.indexOf('+') === -1) {
                    phoneNumber = '+' + phoneNumber;
                }

                // adding "-" if phone number does not contain one.
                const ten_digit = phoneNumber.substr(phoneNumber.length - 10);
                const country_code = phoneNumber.split(ten_digit)[0];
                if (phoneNumber.length > 10 && phoneNumber.indexOf('-') === -1) {
                    phoneNumber = `${country_code}-${ten_digit}`;
                }
                const options = getRequestOptions();
                options.headers["x-api-key"] = clientEnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY");
                const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
                const apiUrl = `${ReanBackendBaseUrl}patients/search?phone=${encodeURIComponent(phoneNumber)}`;
                console.log("apiUrl", apiUrl);
                const response = await needle("get", apiUrl, options);
                Logger.instance().log(`Response: ${apiUrl}`);
                Logger.instance().log(`Status code: ${response.statusCode}`);
                Logger.instance().log(`Message: ${response.body.message}`);

                if (response.statusCode !== 200) {
                    reject("Failed to get response from API.");
                }
                Logger.instance().log(`Got patients count : ${response.body.Data.Patients.Items.length}`);

                if (response.body.Data.Patients.Items.length === 0) {
                    resolve({ sendDff: true, message: { "fulfillmentMessages": [{ "text": { "text": ['No patient found for given phone number'] } }]  } });

                }

                let sendDff = false;
                let data = response.body.Data.Patients.Items;
                if (response.body.Data.Patients.Items.length > 1) {
                    const patientNumber = 1;

                    if (patientNumber > 0) {
                        const selectedPatient = response.body.Data.Patients.Items[patientNumber - 1];
                        data = [selectedPatient];

                    } else {
                        sendDff = true;
                        let dffMessage = 'Hi, looks like you have multiple profiles connected with given phone number. Please select one from below: \n';
                        let count = 1;

                        response.body.Data.Patients.Items.forEach((patient) => {
                            dffMessage += `${count}. ${patient.DisplayName} (${patient.DisplayId}) \n`;
                            count++;
                        });

                        dffMessage += '\n Please enter number to select profile.';

                        data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };
                    }
                }

                resolve({ sendDff: sendDff, message: data });
            }
            catch (error) {
                Logger.instance().log_error(error.message, 500, "patient Info Service Error!");
                reject(error.message);
            }
        });
    }

    async getMedicationInfoservice (patientUserId, accessToken) {
        return new Promise(async (resolve, reject) => {
            try {
                Logger.instance().log(`Get MedicationInfo API`);
                const options = getRequestOptions("rean_app");
                options.headers["x-api-key"] = clientEnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
                const apiUrl = `${ReanBackendBaseUrl}clinical/medications/current/${patientUserId}`;

                const response = await needle("get", apiUrl, options);

                if (response.statusCode !== 200) {
                    reject("Failed to get response from API.");
                    return;
                }

                let dffMessage = '';
                if (response.body.Data.CurrentMedications.length === 0) {
                    dffMessage = 'Looks like you dont have any medications right now.';
                } else {
                    dffMessage = 'Below are your medications: \n';
                    let count = 1;

                    response.body.Data.CurrentMedications.forEach((medication) => {
                        dffMessage += `${count}. Name: ${medication.DrugName} - Dose: ${medication.Dose} ${medication.DosageUnit} \n`;
                        count++;
                    });
                }

                const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

                resolve({ sendDff: true, message: data });
            }
            catch (error) {
                Logger.instance().log_error(error.message, 500, "Medication Info Service Error!");
                reject(error.message);
            }
        });
    }

}
