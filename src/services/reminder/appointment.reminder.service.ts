import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { GetPatientInfoService } from '../support.app.service';
import { CacheMemory } from '../cache.memory.service';
import { GeneralReminderService } from './general.reminder.service';

@scoped(Lifecycle.ContainerScoped)
export class AppointmentReminderService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,
        @inject(GeneralReminderService) private generalReminderService?: GeneralReminderService,

    ){}

    async createReminder (eventObj) {
        try {
            const event = eventObj.body.queryResult.parameters.event;
            let date = eventObj.body.queryResult.parameters.dateTime;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;

            //const timeString = eventObj.body.queryResult.outputContexts[0].parameters["time.original"];
            //const phoneNumber : any = await this.needleService.getPhoneNumber(eventObj);
            console.log(`Time stamp in appointment reminder ${date}`);
            if (date.date_time) {
                date = date.date_time;
            }

            const channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const patientUserId = await this.getPatientUserId(channel, personPhoneNumber, personName);

            const { whenDay, whenTime } = await this.generalReminderService.extractWhenDateTime(date);
            console.log(`date and time ${event} ${whenDay} ${whenTime}`);
            const jsonFormat = {
                patientUserId : patientUserId,
                TaskName      : event,
                TaskType      : "other",
                Frequency     : "Once",
                DayName       : null
            };
            
            await this.generalReminderService.createCommonReminders(eventObj, "Once", jsonFormat, patientUserId, whenDay, whenTime, personName, personPhoneNumber, null );
            await this.generalReminderService.createCommonReminders(eventObj, "Once", jsonFormat, patientUserId, whenDay, "07:00:00", personName, personPhoneNumber, null );

            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": ["Your reminder has been successfully set, and you will receive a notification at the scheduled time."] }
                    }
                ]
            };

            return { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Send success reminder creation error');
        }
    }

    public async getPatientUserId(channel: any, personPhoneNumber: string, personName: string) {
        let patientUserId = null;
        if (channel === "telegram") {
            const apiURL = `patients/search?userName=${personPhoneNumber}`;
            const result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.Patients.Items.length === 0) {
                const obj = {
                    Phone          : `+91-${this.generateRandomPhoneNumber()}`,
                    Password       : "Test@123",
                    FirstName      : personName,
                    UserName       : personPhoneNumber,
                    TelegramChatId : personPhoneNumber
                };
                const apiURL = `patients`;
                const response = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
                patientUserId = response.Data.Patient.UserId;
            } else {
                patientUserId = result.Data.Patients.Items[0].UserId;
            }
        } else if (channel === "whatsappMeta") {
            const apiURL = `patients/byPhone?phone=${encodeURIComponent(this.convertPhoneNumber(personPhoneNumber))}`;
            const result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.Patients.Items.length === 0) {
                const obj = {
                    Phone     : this.convertPhoneNumber(personPhoneNumber),
                    Password  : "Test@123",
                    FirstName : personName
                };
                const apiURL = `patients`;
                const response = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
                patientUserId = response.Data.Patient.UserId;
            } else {
                patientUserId = result.Data.Patients.Items[0].UserId;
            }
        }
        return patientUserId;
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
        return completeNumber;
    }

    generateRandomPhoneNumber(): string {
        const now = new Date();
        const seed = now.getTime();
        const nu = Math.floor((seed % 10000000000));
        return `${nu}`;
    }

}
