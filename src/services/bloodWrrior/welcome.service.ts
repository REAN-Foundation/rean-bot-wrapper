import { GetPatientInfoService } from '../support.app.service';
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';

@scoped(Lifecycle.ContainerScoped)
export class BloodWarriorWelcomeService {

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,
    ){}
    
    async registrationService (eventObj) {
        // eslint-disable-next-line max-len
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
            "Patient"      : "BloodWarrior_Patient",
            "Donor"        : "BloodWarrior_Donor",
            "System admin" : "BloodWarrior_Admin",
            "Volunteer"    : "BloodWarrior_Volunteer"
        };
        return message[roleId] ?? "New_User";
    }

    public async getRoleId(eventObj) {
        const phoneNumber = await this.needleService.getPhoneNumber(eventObj);
        const apiURL = `persons/phone/${phoneNumber}`;
        const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
        let roleId = 0;
        if (requestBody.Data.Persons !== null) {
            roleId = requestBody.Data.Persons.Roles[0].RoleName;
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
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            const bloodGroup = result.Data.HealthProfile.BloodGroup;
            let transfusionDate = result.Data.HealthProfile.BloodTransfusionDate ?? null;
            if (transfusionDate) {
                transfusionDate = new Date(transfusionDate.split("T")[0]).toDateString();
            }
            const dffMessage = `Welcome to Blood Warriors ${name},\n\nHere are the details we have found:
            *Patient Name:* ${name},
            *Blood Group:* ${bloodGroup},
            *Expected Next Blood Transfusion Date:* ${transfusionDate}\nIf the details are correct, please click *proceed* to get reminders or if you can register as a new patient.`;
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
