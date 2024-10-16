import { GetHeaders } from '../../services/biometrics/get.headers';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { GetPatientInfoService } from '../support.app.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { Registration } from '../registration/patient.registration.service';

@scoped(Lifecycle.ContainerScoped)
export class HeartFailureRegistrationService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(GetHeaders) private getHeaders: GetHeaders,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService,
        @inject(GetPatientInfoService) private getPatientInfoService: GetPatientInfoService,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(Registration) private registration?: Registration,
    ) {}

    async registrationService (eventObj): Promise<any> {
        try {
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const patientUserId = await this.registration.getPatientUserId(channel,
                personPhoneNumber, personName);

            const body : QueueDoaminModel =  {
                Intent : "RegistrationHeartFailure",
                Body   : {
                    PatientUserId : patientUserId,
                    Name          : personName,
                    EventObj      : eventObj
                }
            };
            const patientUpdateUrl = `patients${patientUserId}`;

            const patientDomainModel = {
                Phone     : `+91-${personPhoneNumber}`,
                Gender    : "Male",
                BirthDate : new Date("2000-01-01").toISOString()
                    .split("T")[0],
            };
            await this.needleService.needleRequestForREAN("put", patientUpdateUrl, null, patientDomainModel);
            
            const registrationMessage = `Hi ${personName}, \nWe're fetching your heart failure care plan details. Please hold on a moment!⏳`;
            FireAndForgetService.enqueue(body);
            return { fulfillmentMessages: [{ text: { text: [registrationMessage] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Heart failure careplan registration service error');
        }

    }

    public async enrollPatientService(patientUserId: any, name: string, eventObj: any) {
        const communicationSearchUrl = `clinical/donation-communication/search?patientUserId=${patientUserId}`;
        const communicationResponse = await this.needleService.needleRequestForREAN("get", communicationSearchUrl);

        let msg = `Welcome! ${name}, \nWe're excited to have you as part of our community. Congratulations on successfully enrolling in the care plan! You will receive reminders about lifestyle changes, medication tips, and updates on your condition to help you stay on track. We're here to assist you every step of the way! \nLet’s take this journey to better heart health together. 🌟`;
        if (communicationResponse.Data.DonationCommunication.Items.length !== 0) {
            const remindersFlag = communicationResponse.Data.DonationCommunication.Items[0].IsRemindersLoaded;
            if (remindersFlag === false) {
                await this.enrollPatient(patientUserId, name, msg, eventObj);
            } else {
                msg = `You have already enrolled in the Haert Failure care plan. If you wish to enroll again please contact to REAN support. https://www.reanfoundation.org/`;
                await this.sendMessage(msg, eventObj);
            }
        } else {
            await this.enrollPatient(patientUserId, name, msg, eventObj);
        }
    }

    async enrollPatient(patientUserId: string, name: string, msg: string, eventObj) {

        const channel: string = eventObj.body.originalDetectIntentRequest.payload.source;
        const enrollmentUrl = `care-plans/patients/${patientUserId}/enroll`;
        const obj1 = {
            Provider  : "REAN",
            PlanName  : "Heart Failure",
            PlanCode  : "Heart-Failure",
            StartDate : new Date().toISOString()
                .split('T')[0],
            DayOffset  : 0,
            Channel    : this.getPatientInfoService.getReminderType(channel),
            TenantName : this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME")
        };
        const resp = await this.needleService.needleRequestForREAN("post", enrollmentUrl, null, obj1);

        const communicationUrl = `clinical/donation-communication`;
        const obj = {
            PatientUserId     : patientUserId,
            IsRemindersLoaded : true
        };
        await this.needleService.needleRequestForREAN("post", communicationUrl, null, obj);

        const enrollmentId = resp.Data.Enrollment.id;
        Logger.instance().log(`Enrollment id of user ${name} is: ${enrollmentId}`);
        await this.sendMessage(msg, eventObj);
    }

    async sendMessage(this: any, msg: string, eventObj) {
        const msgPayload: Iresponse = commonResponseMessageFormat();
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
        this._platformMessageService = eventObj.container.resolve("telegram");
        msgPayload.platform = payload.source;
        msgPayload.sessionId = personPhoneNumber;
        msgPayload.messageText = msg;
        msgPayload.message_type = "text";
        await this._platformMessageService.SendMediaMessage(msgPayload, null);
    }

}
