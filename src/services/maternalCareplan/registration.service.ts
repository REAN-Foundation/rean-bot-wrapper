import { GetHeaders } from '../../services/biometrics/get.headers';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import needle from 'needle';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { GetPatientInfoService } from '../support.app.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';

@scoped(Lifecycle.ContainerScoped)
export class RegistrationService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(GetHeaders) private getHeaders: GetHeaders,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService,
        @inject(GetPatientInfoService) private getPatientInfoService: GetPatientInfoService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    async registrationService (eventObj): Promise<any> {
        try {
            const name : string = eventObj.body.queryResult.parameters.Name.name;
            const lmp : string = eventObj.body.queryResult.parameters.LMP;
            const birthdate : string = eventObj.body.queryResult.parameters.Birthdate;

            const phoneNumber = await this.needleService.getPhoneNumber(eventObj);

            const options = await this.getHeaders.getHeaders();
            const ReanBackendBaseUrl = process.env.REAN_APP_BACKEND_BASE_URL;
            const patientRegisterUrl = `${ReanBackendBaseUrl}patients`;

            const patientDomainModel = {
                Phone      : phoneNumber,
                Password   : process.env.USER_REGISTRATION_PASSWORD,
                FirstName  : name.split(" ")[0],
                LastName   : name.split(" ")[1],
                Gender     : "Female",
                BirthDate  : birthdate.split("T")[0],
                TenantCode : this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME")
            };

            const patientUserId = null;

            const body : QueueDoaminModel =  {
                Intent : "RegistrationDMC",
                Body   : {
                    PatientUserId : patientUserId,
                    Name          : name,
                    LMP           : lmp,
                    EventObj      : eventObj
                }
            };

            const registrationResponse = await needle('post', patientRegisterUrl, patientDomainModel, options);
            if (registrationResponse.statusCode === 409) {
                const result: any = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
                body.Body.PatientUserId = result.message[0].UserId;
                const dffMessage = `Hi ${name}, \nYour phone number already registered with us.`;
                FireAndForgetService.enqueue(body);
                return { fulfillmentMessages: [{ text: { text: [dffMessage] } }]  };

            } else if (registrationResponse.statusCode === 201) {
                body.Body.PatientUserId = registrationResponse.body.Data.Patient.UserId;
                const registrationMessage = `Hi ${name}, \nYour Last Mensuration Period(LMP) date is ${new Date(lmp.split("T")[0]).toDateString()}.\nYou will get periodic notifications based on your LMP.`;
                FireAndForgetService.enqueue(body);
                return { fulfillmentMessages: [{ text: { text: [registrationMessage] } }]  };
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Maternity careplan registration service error');
        }

    }

    public async enrollPatientService(patientUserId: any, name: string, lmp: string, eventObj: any) {
        const communicationSearchUrl = `clinical/donation-communication/search?patientUserId=${patientUserId}`;
        const communicationResponse = await this.needleService.needleRequestForREAN("get", communicationSearchUrl);

        let msg = null;
        if (communicationResponse.Data.DonationCommunication.Items.length !== 0) {
            const remindersFlag = communicationResponse.Data.DonationCommunication.Items[0].IsRemindersLoaded;
            if (remindersFlag === false) {
                msg = `Welcome! ${name}, you have successfully subscribed to the REAN Maternity care plan and will get periodic notifications on your due dates.`;
                await this.enrollPatient(lmp, patientUserId, name, msg, eventObj);
            } else {
                msg = `You have already enrolled in REAN DMC Maternity care plan. If you wish to enroll again please contact to REAN support.`;
                await this.sendMessage(msg, eventObj);
            }
        } else {
            msg = `Welcome! ${name}, you have successfully subscribed to the REAN Maternity care plan and will get periodic notifications on your due dates.`;
            await this.enrollPatient(lmp, patientUserId, name, msg, eventObj);
        }
    }

    async enrollPatient(lmp: string, patientUserId: any, name: string, msg: string, eventObj) {
        const date_1 = new Date(lmp.split("T")[0]);
        const date_2 = new Date();
        const days = (date_1: Date, date_2: Date) => {
            const difference = date_2.getTime() - date_1.getTime();
            const TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
            return TotalDays;
        };

        const channel = eventObj.body.originalDetectIntentRequest.payload.source;
        const enrollmentUrl = `care-plans/patients/${patientUserId}/enroll`;
        const obj1 = {
            Provider  : "REAN",
            PlanName  : "Maternity Careplan",
            PlanCode  : "DMC-Maternity",
            StartDate : new Date().toISOString()
                .split('T')[0],
            DayOffset  : (days(date_1, date_2) - 28),
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
        const response_format: Iresponse = commonResponseMessageFormat();
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        this._platformMessageService = eventObj.container.resolve(payload.source);
        const b = eventObj.body.session;
        const patientPhoneNumber = b.split("/", 5)[4];
        response_format.platform = payload.source;
        response_format.sessionId = patientPhoneNumber;
        response_format.messageText = msg;
        response_format.message_type = "text";
        await this._platformMessageService.SendMediaMessage(response_format, null);
    }

}
