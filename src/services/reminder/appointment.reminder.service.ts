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
            let patientUserId = null;
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

}
