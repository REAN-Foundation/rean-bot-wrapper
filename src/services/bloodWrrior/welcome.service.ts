import { GetPatientInfoService } from '../support.app.service';
import { container } from 'tsyringe';
import { Logger } from '../../common/logger';
import { autoInjectable } from 'tsyringe';
import { getPhoneNumber, needleRequestForREAN } from '../needle.service';
import { kerotoplasty_service } from '../kerotoplasty.service';

@autoInjectable()
export class BloodWarriorWelcomeService {

    getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

    ketoplastyService: kerotoplasty_service = container.resolve(kerotoplasty_service);
    
    async registrationService (eventObj) {
        try {
            const phoneNumber = await getPhoneNumber(eventObj);
            const apiURL = `persons/phone/${phoneNumber}`;
            const requestBody = await needleRequestForREAN("get", apiURL);
            let roleId = 0;
            if (requestBody.Data.Persons !== null) {
                roleId = requestBody.Data.Persons.Roles[0].RoleId;
            }
            const triggering_event = await this.getEvent(roleId);
            return await this.ketoplastyService.trigger_intent(triggering_event,eventObj);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    public getEvent(roleId) {
        const message = {
            2  : "BloodWarrior_Patient",
            11 : "BloodWarrior_Donor",
            1  : "BloodWarrior_Admin"
        };
        return message[roleId] ?? "New_User";
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
            const transfusionDate = result.Data.HealthProfile.BloodTransfusionDate;
            const stringDate = new Date(transfusionDate.split("T")[0]).toDateString();
            
            const dffMessage = `Welcome to Blood Warriors ${name},\nHere are the details we have found:
            Patient Name: ${name},
            Blood Group: ${bloodGroup},
            Expected next Blood Transfusion Date: ${stringDate}\nIf the details are correct, please click proceed or if you can register as a new patient.`;
            console.log(dffMessage);

            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    },
                    {
                        "payload" : {
                            "messagetype" : "interactive-buttons",
                            "buttons"     : [
                                {
                                    "reply" : {
                                        "title" : "Proceed",
                                        "id"    : "Patient_Confirm"
                                    },
                                    "type" : "reply"
                                },
                                {
                                    "type"  : "reply",
                                    "reply" : {
                                        "title" : "Change TF Date",
                                        "id"    : "Change_TF_Date"
                                    }
                                }
                            ]
                        }
                    }
                ]
            };
            return await { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

}
