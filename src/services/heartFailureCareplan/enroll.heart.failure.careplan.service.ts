/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Registration } from '../registrationsAndEnrollements/patient.registration.service';
import { SystemGeneratedMessagesService } from "../system.generated.message.service";
import { translateService } from '../translate.service';

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
        @inject(SystemGeneratedMessagesService) private systemGeneratedMessages?: SystemGeneratedMessagesService,
        @inject(translateService) private translateService?: translateService
    ) {}

    async registrationService (eventObj, isTestUser = false ): Promise<any> {
        try {
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const patientIDArray = await this.registration.getPatientUserId(channel,
                personPhoneNumber, personName);

            const body : QueueDoaminModel =  {
                Intent : isTestUser ? "CareplanRegistrationForTestUser" : "RegistrationHeartFailure",
                Body   : {
                    PatientUserId : patientIDArray.patientUserId,
                    Name          : personName,
                    EventObj      : eventObj
                }
            };
            const patientUpdateUrl = `patients/${patientIDArray.patientUserId}`;
            const defaultDOB = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_DOB");
            const defaultGender = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_GENDER");

            const patientDomainModel = {
                Gender    : defaultGender,
                BirthDate : new Date(defaultDOB).toISOString()
                    .split("T")[0],
            };
            await this.needleService.needleRequestForREAN("put", patientUpdateUrl, null, patientDomainModel);
            const careplan_reg_msg = await this.systemGeneratedMessages.getMessage("CAREPLAN_REG_MESSAGE");
            const registrationMessage = `Hi ${personName}, \n` + careplan_reg_msg;
            FireAndForgetService.enqueue(body);
            return { fulfillmentMessages: [{ text: { text: [registrationMessage] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Heart failure disease registration service error');
        }

    }

    public async enrollPatientService(patientUserId: any, name: string, eventObj: any, isTestUser = false) {
        const communicationSearchUrl = `clinical/donation-communication/search?patientUserId=${patientUserId}`;
        const communicationResponse = await this.needleService.needleRequestForREAN("get", communicationSearchUrl);

        let msg = `Welcome! ${name}, \nWe're excited to have you as part of our community. Congratulations on successfully enrolling in the care plan! You will receive reminders about lifestyle changes, medication tips, and updates on your condition to help you stay on track. We're here to assist you every step of the way! \nLet’s take this journey to better heart health together. 🌟`;
        const careplan_welcome_msg = await this.systemGeneratedMessages.getMessage("CAREPLAN_WELCOME_MESSAGE");
        if (careplan_welcome_msg) {
            msg = careplan_welcome_msg;
        }
        if (communicationResponse.Data.DonationCommunication.Items.length !== 0) {
            const remindersFlag = communicationResponse.Data.DonationCommunication.Items[0].IsRemindersLoaded;
            if (remindersFlag === false) {
                await this.enrollPatient(patientUserId, name, msg, eventObj);
            } else {
                const careplan_reg_alt_msg = await this.systemGeneratedMessages.getMessage("CAREPLAN_REG_ALT_MESSAGE");
                msg = careplan_reg_alt_msg;
                await this.sendMessage(msg, eventObj);
            }
        } else {
            await this.enrollPatient(patientUserId, name, msg, eventObj, isTestUser);
        }
    }

    async enrollPatient(patientUserId: string, name: string, msg: string, eventObj, isTestUser = false) {

        const channel: string = eventObj.body.originalDetectIntentRequest.payload.source;
        const buttonId: string = eventObj.body.queryResult.queryText ?? null;
        const enrollRoute = `care-plans/patients/${patientUserId}/enroll`;
        const startDate = this.calculateStartDateByButtonId(buttonId, new Date());

        const planCode = this.getSelectedCareplan(buttonId);
        const careplanLanguage = this.getCareplanLanguage(planCode);

        if (careplanLanguage !== "en") {
            const translatedMsg = await this.translateService.translatestring(msg, careplanLanguage);
            if (translatedMsg) {
                msg = translatedMsg;
            }
        }

        let obj1 = {};
       
        if (isTestUser) {
            const scheduleConfig = this.getScheduleForNextCron(15);
            obj1 = {
                Provider  : 'REAN',
                StartDate : new Date().toISOString()
                    .split('T')[0],
                TenantName     : this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME"),
                PlanCode       : planCode,
                PlanName       : planCode,
                Channel        : this.getPatientInfoService.getReminderType(channel),
                Language       : careplanLanguage,
                IsTest         : true,
                ScheduleConfig : scheduleConfig
            };
        } else {
            obj1 = {
                Provider   : "REAN",
                PlanName   : "Heart Failure",
                PlanCode   : planCode,
                Language   : careplanLanguage,
                StartDate  : startDate.toISOString().split('T')[0],
                DayOffset  : 0,
                Channel    : this.getPatientInfoService.getReminderType(channel),
                TenantName : this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME")
            };
        }

        console.log("enrollPatient Body Object", obj1);
        const response = await this.needleService.needleRequestForREAN("post", enrollRoute, null, obj1);

        // const communicationRoute = `clinical/donation-communication`;
        // const body = {
        //     PatientUserId     : patientUserId,
        //     IsRemindersLoaded : true
        // };
        // await this.needleService.needleRequestForREAN("post", communicationRoute, null, body);

        const enrollmentIdHF = response.Data.Enrollment.id;
        Logger.instance().log(`Enrollment id of Heart failure user ${name} is: ${enrollmentIdHF}`);
        await this.sendMessage(msg, eventObj);
    }

    async sendMessage(this: any, msg: string, eventObj) {
        const msgPayload: Iresponse = commonResponseMessageFormat();
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
        if (payload.source === "telegram" || payload.source === "Telegram") {
            payload.source = "telegram";
        }
        this._platformMessageService = eventObj.container.resolve(payload.source);
        msgPayload.platform = payload.source;
        msgPayload.sessionId = personPhoneNumber;
        msgPayload.messageText = msg;
        msgPayload.message_type = "text";
        await this._platformMessageService.SendMediaMessage(msgPayload, null);
    }

    getSelectedCareplan(buttonId: string): string {
        const careplanCodeMapping = {
            "Start_Careplan_HeartF1" : "HD_HTN_Smoker",
            "Start_Careplan_HeartF2" : "HD_HTN_Non-smoker",
            "Start_Careplan_HeartF3" : "HD_No_HTN_Smoker",
            "Start_Careplan_HeartF4" : "HD_No_HTN_Non-smoker",
            "Start_Careplan_HeartF5" : "RF_HTN_Smoker",
            "Start_Careplan_HeartF6" : "RF_HTN_Non-smoker",
            "Start_Careplan_HeartF7" : "RF_No_HTN_Smoker",
            "Start_Careplan_HeartF8" : "RF_No_HTN_Non-smoker",
            "Saath_Health_EN"        : "Saathealth_careplan_en",
            "Saath_Health_HI"        : "Saathealth_careplan_hi",
            "Saath_Health_MR"        : "Saathealth_careplan_mr",
            "Diabetes"               : "Diabetes",
        };
        return careplanCodeMapping[buttonId] ?? "Heart-Failure";
    }

    getCareplanLanguage(planCode: string): string {
        if (!planCode) {
            return "en";
        }
        const languageCodeMapping = {
            "Saathealth_careplan_en" : "en",
            "Saathealth_careplan_hi" : "hi",
            "Saathealth_careplan_mr" : "mr",
        };
        return languageCodeMapping[planCode] ?? "en";
    }
    
    calculateStartDateByButtonId(buttonId: string, todayDate: Date): Date {
        if (buttonId?.startsWith("Start_Careplan_HeartF")) {
            const dayOfWeek = todayDate.getDay();
            if (dayOfWeek === 0) {
                return todayDate;
            } else {
                const daysUntilNextSunday = 7 - dayOfWeek;
                const startDate = new Date(todayDate);
                startDate.setDate(todayDate.getDate() + daysUntilNextSunday);
                return startDate;
            }
        }
        return todayDate;
    }

    private getScheduleForNextCron(intervalMinutes = 15) {
        const now = new Date();
        const next = new Date(now);
    
        const currentMin = now.getMinutes();
        const remainder = currentMin % intervalMinutes;
    
        let minutesToAdd = intervalMinutes - remainder;
        if (minutesToAdd === 0) minutesToAdd = intervalMinutes;
    
        next.setMinutes(currentMin + minutesToAdd);
        next.setSeconds(0);
        next.setMilliseconds(0);
    
        next.setMinutes(next.getMinutes() + 2);
    
        let startFromTomorrow = false;
        if (next.getDate() !== now.getDate()) {
            startFromTomorrow = true;
        }
    
        return {
            NumberOfDays      : 1,
            StartHour         : next.getHours(),
            StartMinutes      : next.getMinutes(),
            IntervalMinutes   : 1,
            StartFromTomorrow : startFromTomorrow
        };
    }

}
