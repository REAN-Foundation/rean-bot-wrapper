import { Logger } from '../../common/logger';
import { GetPatientInfoService } from '../support.app.service';
import { NeedleService } from '../needle.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { BloodWarriorCommonService } from './common.service';
import { EnrollPatientService } from './enroll.service';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { BloodWarriorWelcomeService } from './welcome.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiInteractiveListService } from '../whatsappmeta.button.service';
import { CacheMemory } from '../cache.memory.service';

@scoped(Lifecycle.ContainerScoped)
export class ChangeTransfusionDateService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(EnrollPatientService) private enrollPatientService?: EnrollPatientService,
        @inject(BloodWarriorWelcomeService) private bloodWarriorWelcomeService?: BloodWarriorWelcomeService,
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
                await this.needleService.needleRequestForREAN("put", apiURL, accessToken, obj);
                const dffMessage = `Date updated Successfully. We will remind you before expected transfusion`;

                //Load reminders for patient
                const body : QueueDoaminModel =  {
                    Intent : "Change_TF_Date_Load_Reminders",
                    Body   : {
                        EventObj      : eventObj,
                        PatientUserId : patientUserId
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

    async GetTransfusionDate(eventObj) {
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

    async VolunteerChangeTransfusionDate(eventObj) {
        try {

            const roleId = await this.bloodWarriorWelcomeService.getRoleId(eventObj);
            const triggering_event = await this.bloodWarriorWelcomeService.getEvent(roleId);

            if (triggering_event === "BloodWarrior_Volunteer") {
                const volunteer = await this.bloodWarriorCommonService.getVolunteerByPhoneNumber(eventObj);

                //Load reminders for patient
                const body : QueueDoaminModel =  {
                    Intent : "Volunteer_Update_TF_Date",
                    Body   : {
                        EventObj  : eventObj,
                        Volunteer : volunteer
                    }
                };
                FireAndForgetService.enqueue(body);
                return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: ["We are fetching the patient list."] } }] } };

            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    async sendPatientListToVolunteer (body) {

        let result = null;
        const apiURL = `clinical/patient-donors/search?volunteerUserId=${body.Volunteer.UserId}`;
        result = await this.needleService.needleRequestForREAN("get", apiURL);
        const patientList = this.extractUniquePatientInfo(result);

        const arrayListIds = [];
        let i = 1;
        patientList.forEach((patient) => {
            arrayListIds.push(`${patient.Name}`, `patient-${i}`);
            CacheMemory.set(`patient-${i}`, patient.PatientUserId);
            i = i + 1;
        });

        console.log(arrayListIds);
        const payload = await sendApiInteractiveListService(arrayListIds);
        const message = "Please select the patient to whom you want to change blood donation date.";
        const intentPayload = body.EventObj.body.originalDetectIntentRequest.payload;
        this._platformMessageService = body.EventObj.container.resolve(intentPayload.source);
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.platform = intentPayload.source;
        response_format.sessionId = intentPayload.userId;
        response_format.messageText = message;
        response_format.message_type = "interactivelist";
        await this._platformMessageService.SendMediaMessage(response_format, payload);

    }

    async extractSelectedPatient (eventObj) {

        let dffMessage = null;
        const transfusionDate = eventObj.body.queryResult.parameters.transfusionDate;
        const name = eventObj.body.queryResult.outputContexts[0].name;
        const dayDiffrence = await this.bloodWarriorCommonService.differenceBetweenTwoDates(new Date(transfusionDate.split("T")[0]), new Date());
        if (dayDiffrence > -1) {
            const key = this.extractPatientId(name);
            const patientUserId = await CacheMemory.get(key);
        
            //Update patient health profile
            const apiURL = `patient-health-profiles/${patientUserId}`;
            const obj = {
                BloodTransfusionDate : transfusionDate.split("T")[0]
            };
            await this.needleService.needleRequestForREAN("put", apiURL, null, obj);
            dffMessage = `Date ${transfusionDate.split("T")[0]} updated Successfully. We will remind you before expected transfusion`;

            //Load reminders for patient
            const body : QueueDoaminModel =  {
                Intent : "Change_TF_Date_Load_Reminders",
                Body   : {
                    EventObj      : eventObj,
                    PatientUserId : patientUserId
                }
            };
            FireAndForgetService.enqueue(body);
        } else {
            dffMessage = `Entered blood transfusion date should not be a past date. Please try again.`;
        }
        return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };

    }

    extractUniquePatientInfo = (data) => {
        const patientDonors = data.Data.PatientDonors.Items;
        const uniquePatients = new Map<string, { Name: string, NextDonationDate: string }>();
    
        patientDonors.forEach((item) => {
            if (!uniquePatients.has(item.PatientUserId)) {
                uniquePatients.set(item.PatientUserId, { Name: item.Name, NextDonationDate: item.NextDonationDate });
            }
        });
    
        return Array.from(uniquePatients.entries()).map(([PatientUserId, { Name, NextDonationDate }]) =>
            ({ PatientUserId, Name, NextDonationDate }));
    };

    extractPatientId(contextPath: string): string | null {
        const regex = /\/contexts\/(patient-\d+)/;
        const match = contextPath.match(regex);
        return match ? match[1] : null;
    }

}
