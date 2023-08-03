import { Logger } from '../../common/logger';
import { GetPatientInfoService } from '../support.app.service';
import { NeedleService } from '../needle.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { BloodWarriorCommonService } from './common.service';
import { EnrollPatientService } from './enroll.service';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';

@scoped(Lifecycle.ContainerScoped)
export class ChangeTransfusionDateService {

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(EnrollPatientService) private enrollPatientService?: EnrollPatientService,
    ) {}

    async ChangeTransfusionDate(eventObj) {
        try {
            const transfusionDate = eventObj.body.queryResult.parameters.Transfusion_Date;
            let result = null;
            const dayDiffrence = await this.bloodWarriorCommonService.differenceBetweenTwoDates(new Date(transfusionDate.split("T")[0]), new Date());
            if (dayDiffrence > -1) {
                result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
    
                const patientUserId = result.message[0].UserId;
                const accessToken = result.message[0].accessToken;
           
                //Update patient health profile
                const apiURL = `patient-health-profiles/${patientUserId}`;
                const obj = {
                    BloodTransfusionDate : transfusionDate.split("T")[0]
                };
                const requestBody = await this.needleService.needleRequestForREAN("put", apiURL, accessToken, obj);
                const dffMessage = `Date updated Successfully. We will remind you before expected transfusion`;

                //Load reminders for patient
                const body : QueueDoaminModel =  {
                    Intent : "Change_TF_Date_Load_Reminders",
                    Body   : {
                        EventObj : eventObj
                    }
                };
                FireAndForgetService.enqueue(body);
                return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
            } else {
                const dffMessage = `Entered blood transfusion date should not be a past date. Please try again.`;
                return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    async GiveTransfusionDate(eventObj) {
        try {
            let result = null;
            result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            
            if (result.message.length > 0) {
    
                const patientUserId = result.message[0].UserId;
                const apiURL = `patient-health-profiles/${patientUserId}`;
                result = await this.needleService.needleRequestForREAN("get", apiURL);
                let transfusionDate = result.Data.HealthProfile.BloodTransfusionDate;
                let dffMessage = null;
                if (transfusionDate) {
                    transfusionDate = new Date(transfusionDate).toDateString();
                    dffMessage = `Your current blood transfusion date is ${transfusionDate}.`;
                } else {
                    dffMessage = `You still need to enter your transfusion date. Please update using the button 'Change Donation Date'.`;
                }
                return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };

            } else {
                const dffMessage = `Your phone number is not registered as patient profile.`;
                return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

}
