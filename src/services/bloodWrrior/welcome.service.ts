import { GetPatientInfoService } from '../support.app.service';
import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import { getPhoneNumber, needleRequestForREAN } from '../needle.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';

@autoInjectable()
export class BloodWarriorWelcomeService {

    getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

    dialoflowMessageFormattingService: dialoflowMessageFormatting = container.resolve(dialoflowMessageFormatting);
    
    async registrationService (eventObj) {
        try {
            const roleId = await this.getRoleId(eventObj);
            const triggering_event = await this.getEvent(roleId);
            return await this.dialoflowMessageFormattingService.triggerIntent(triggering_event,eventObj);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    public getEvent(roleId) {
        const message = {
            2  : "BloodWarrior_Patient",
            11 : "BloodWarrior_Donor",
            1  : "BloodWarrior_Admin",
            12 : "BloodWarrior_Volunteer"
        };
        return message[roleId] ?? "New_User";
    }

    public async getRoleId(eventObj) {
        const phoneNumber = await getPhoneNumber(eventObj);
        const apiURL = `persons/phone/${phoneNumber}`;
        const requestBody = await needleRequestForREAN("get", apiURL);
        let roleId = 0;
        if (requestBody.Data.Persons !== null) {
            roleId = requestBody.Data.Persons.Roles[0].RoleId;
        }
        return roleId;
    }

    async patientService (eventObj) {
        try {
            let result = null;
            result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            const patientUserId = result.message[0].UserId;
            const name = result.message[0].DisplayName;

            //get medical details for patient
            const apiURL = `patient-health-profiles/${patientUserId}`;
            result = await needleRequestForREAN("get", apiURL);
            const bloodGroup = result.Data.HealthProfile.BloodGroup;
            let transfusionDate = result.Data.HealthProfile.BloodTransfusionDate ?? null;
            if (transfusionDate) {
                transfusionDate = new Date(transfusionDate.split("T")[0]).toDateString();
            }
            const dffMessage = `Welcome to Blood Warriors ${name},\nHere are the details we have found:
            Patient Name: *${name}*,
            Blood Group: *${bloodGroup}*,
            Expected Next Blood Transfusion Date: *${transfusionDate}*\nIf the details are correct, please click *proceed* to get reminders or if you can register as a new patient.`;
            console.log(dffMessage);
            
            const payloadButtons = await whatsappMetaButtonService("Proceed","Patient_Confirm","Change Donation Date","Change_TF_Date");
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    },
                    payloadButtons
                ]
            };
            return await { sendDff: true, message: data };
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

}
