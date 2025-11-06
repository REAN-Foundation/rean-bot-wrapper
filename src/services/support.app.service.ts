import { Logger } from '../common/logger.js';
import { getRequestOptions } from '../utils/helper.js';
import needle from "needle";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service.js';
import { inject, Lifecycle, scoped,  } from 'tsyringe';
import { GetHeaders } from '../services/biometrics/get.headers.js';
import type { Dose,Duration,MedicationDomainModel,MedicineName } from '../refactor/interface/medication.interface.js';
import { MedicationAdministrationRoutes} from '../refactor/interface/medication.interface.js';
import { NeedleService } from './needle.service.js';
import { NotificationType } from '../domain.types/reminder/reminder.domain.model.js';

// eslint-disable-next-line max-len
@scoped(Lifecycle.ContainerScoped)
export class GetPatientInfoService{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetHeaders) private getHeaders?: GetHeaders,
    ){}

    async getPatientsByPhoneNumberservice (eventObj) {
        return new Promise(async (resolve, reject) => {
            try {
                Logger.instance().log(`Get Patient Info API ${this.clientEnvironmentProviderService.getClientName()}`);

                const phoneNumber = await this.needleService.getPhoneNumber(eventObj);
                const options = this.getHeaders.getHeaders();
                const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
                const apiUrl = `${ReanBackendBaseUrl}patients/byPhone?phone=${encodeURIComponent(phoneNumber)}`;
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
                options.headers["x-api-key"] = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY");
                options.headers["authorization"] = `Bearer ${accessToken}`;
                const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
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

    async addMedicationInfoservice (eventObj) {
        try {
            Logger.instance().log(`Add MedicationInfo API`);
            const options = getRequestOptions("rean_app");

            let result = null;
            result = await this.getPatientsByPhoneNumberservice(eventObj);

            const patientUserId = result.message[0].UserId;
            const accessToken = result.message[0].accessToken;
            options.headers["x-api-key"] = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY");
            options.headers["authorization"] = `Bearer ${accessToken}`;
            const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");

            const medicineName: string = eventObj.body.queryResult.parameters.medicine;
            const frequency: string = eventObj.body.queryResult.parameters.frequency;
            const dose: Dose = eventObj.body.queryResult.parameters.dose;
            const duration: Duration = eventObj.body.queryResult.parameters.duration;

            let apiUrl = `${ReanBackendBaseUrl}clinical/drugs/search?name=${medicineName}`;
            const resp = await needle("get", apiUrl, options);

            let medicineId: string = null;

            const len = resp.body.Data.Drugs.Items.length;
            for (var j = 0; j < len ; j++ ) {
                const medicineP = resp.body.Data.Drugs.Items[j].DrugName;
                if (medicineP.toLocaleLowerCase() === medicineName.toLowerCase()){
                    medicineId = resp.body.Data.Drugs.Items[j].id;
                    break;
                }
            }

            const obj: MedicineName = {
                DrugName         : medicineName,
                OtherInformation : 'Added through bot'
            };

            if (medicineId === null) {
                const url = `${ReanBackendBaseUrl}clinical/drugs`;
                const resp1 = await needle('post', url, obj, options);
                medicineId = resp1.body.Data.Drug.id;
            }

            apiUrl = `${ReanBackendBaseUrl}clinical/medications`;
            const obj1: MedicationDomainModel = {
                PatientUserId   : patientUserId,
                DrugName        : medicineName,
                DrugId          : medicineId,
                Dose            : dose.count,
                DosageUnit      : dose.dose,
                TimeSchedules   : null,
                Frequency       : 2,
                FrequencyUnit   : "Daily",
                Route           : MedicationAdministrationRoutes.Oral,
                Duration        : duration.amount,
                DurationUnit    : duration.unit,
                ImageResourceId : null,
            };

            switch (duration.unit) {
            case "day": {
                obj1.DurationUnit = "Days";
                break;
            }
            case "wk": {
                obj1.DurationUnit = "Weeks";
                break;
            }
            case "mo": {
                obj1.DurationUnit = "Months";
                break;
            }
            }

            switch (frequency) {
            case "Morning, Afternoon, Evening and Night": {
                obj1.TimeSchedules = ["Morning","Afternoon","Evening", "Night"];
                obj1.Frequency = 4;
                break;
            }
            case "Morning, Afternoon and Evening": {
                obj1.TimeSchedules = ["Morning","Afternoon","Night"];
                obj1.Frequency = 3;
                break;
            }
            case "Morning and Evening": {
                obj1.TimeSchedules = ["Morning","Evening"];
                obj1.Frequency = 2;
                break;
            }
            case "Morning": {
                obj1.TimeSchedules = ["Morning"];
                obj1.Frequency = 1;
                break;
            }
            case "Night":{

                obj1.TimeSchedules = ["Night"];
                obj1.Frequency = 1;
                break;
            }
            case "Evening": {
                obj1.TimeSchedules = ["Evening"];
                obj1.Frequency = 1;
                break;

            }
            case "Empty Stomach":
            case "Once": {

                obj1.TimeSchedules = ["Custom"];
                obj1.Frequency = 1;
                break;
            }
            }

            console.log( "start date is",obj1);
            const resp2 = await needle('post', apiUrl, obj1, options);

            if (resp2.statusCode !== 201) {
                throw new Error("Failed to get response from API.");
            }
            const a = resp2.body.Data.Medication.DrugName;

            const dffMessage = `Your ${a} ${dose.count} ${dose.dose} has been recorded for ${duration.amount} ${duration.unit}, at ${frequency}.`;

            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            return { sendDff: true, message: data };
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Add medication Info Service Error!");
            throw new Error(`Handle add medication service ${error}`);
        }
    }

    generateRandomPhoneNumber(): string {
        const now = new Date();
        const seed = now.getTime();
        const number = Math.floor((seed % 10000000000));
        return `${number}`;
    }

    convertPhoneNumber(phoneNumber: string): boolean {

        let completeNumber = null;
        if (phoneNumber.length === 12) {
            const contryCode = phoneNumber.slice(0, 2);
            const number = phoneNumber.slice(2, 12);
            completeNumber = `+${contryCode}-${number}`;
        }
        else if (phoneNumber.length === 11) {
            const contryCode = phoneNumber.slice(0, 1);
            const number = phoneNumber.slice(1, 11);
            completeNumber = `+${contryCode}-${number}`;
        }
        else if (phoneNumber.length === 13) {
            const contryCode = phoneNumber.slice(0, 3);
            const number = phoneNumber.slice(3, 13);
            completeNumber = `+${contryCode}-${number}`;
        }
        return completeNumber;
    }

    getReminderType( channel: string) {
        const channelType = {
            "whatsappMeta" : NotificationType.WhatsApp,
            "telegram"     : NotificationType.Telegram,
            "Telegram"     : NotificationType.Telegram,
            "whatsappWati" : NotificationType.WhatsappWati
        };
        return channelType[channel] ?? NotificationType.WhatsApp;
    }

}
