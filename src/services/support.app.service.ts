import { Logger } from '../common/logger';
import { getRequestOptions } from '../utils/helper';
import needle from "needle";
const ReanBackendBaseUrl = process.env.REAN_APP_BACKEND_BASE_URL;

export const getPatientsByPhoneNumberservice = async (phoneNumber, patientNumber = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get Patient Info API`);

            if (phoneNumber.length > 10 && phoneNumber.indexOf('+') === -1) {
                phoneNumber = '+' + phoneNumber;
            }

            const options = getRequestOptions();
            console.log("Phone Number", phoneNumber);

            const apiUrl = `${ReanBackendBaseUrl}/patient/get-by-phone?phoneNumber=${encodeURIComponent(phoneNumber)}`;
            const response = await needle("get", apiUrl, options);
            if (response.statusCode !== 200) {
                reject("Failed to get response from API.");
            }
            Logger.instance().log(`Got patients count : ${response.body.data.Patients.length}`);

            if (response.body.data.Patients.length === 0) {
                reject("No patient found for given phone number.");
                return;
            }

            let sendDff = false;
            let data = response.body.data.Patients;
            if (response.body.data.Patients.length > 1) {
                patientNumber = 1;

                if (patientNumber > 0) {
                    const selectedPatient = response.body.data.Patients[patientNumber - 1];
                    data = [selectedPatient];

                } else {
                    sendDff = true;
                    let dffMessage = 'Hi, looks like you have multiple profiles connected with given phone number. Please select one from below: \n';
                    let count = 1;

                    response.body.data.Patients.forEach((patient) => {
                        dffMessage += `${count}. ${patient.FirstName} ${patient.LastName} (${patient.DisplayId}) \n`;
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
};

export const getMedicationInfoservice = async (patientUserId, accessToken) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get MedicationInfo API`);

            const options = getRequestOptions("rean_app");
            options.headers["authorization"] = `Bearer ${accessToken}`;
            const apiUrl = `${ReanBackendBaseUrl}/medication?patientUserId=${patientUserId}`;

            const response = await needle("get", apiUrl, options);

            if (response.statusCode !== 200) {
                reject("Failed to get response from API.");
                return;
            }

            let dffMessage = '';
            if (response.body.data.medications.length === 0) {
                dffMessage = 'Looks like you dont have any medications right now.';
            } else {
                dffMessage = 'Below are your medications: \n';
                let count = 1;

                response.body.data.medications.forEach((medication) => {
                    dffMessage += `${count}. Name: ${medication.Drug} - Dose: ${medication.Dose} ${medication.DosageUnit} \n`;
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
};
