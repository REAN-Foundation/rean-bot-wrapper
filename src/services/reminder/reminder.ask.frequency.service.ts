import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiButtonService } from '../whatsappmeta.button.service';
import { GetPatientInfoService } from '../support.app.service';
import { GeneralReminderService } from './general.reminder.service';
import { CacheMemory } from '../cache.memory.service';
import { TimeHelper } from '../../common/time.helper';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { sendTelegramButtonService } from '../telegram.button.service';
import { Iresponse } from '../../refactor/interface/message.interface';

@scoped(Lifecycle.ContainerScoped)
export class ReminderFrequencyService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GeneralReminderService) private generalReminderService?: GeneralReminderService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,

    ){}

    async createReminder (eventObj: any, frequency: string) {
        try {

            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const phoneNumber : any = await this.needleService.getPhoneNumber(eventObj);
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;

            const dayNames = eventObj.body.queryResult.parameters.dayNames;
            console.log(`dayNames ${dayNames}`);

            // const medicineName : string = eventObj.body.queryResult.parameters.medicineName;
            const jsonFormat = await CacheMemory.get(phoneNumber);
            let dffMessage = null;

            // const timeDifference = TimeHelper.dayDiff(new Date(jsonFormat.StartDateTime), new Date());
            // if (timeDifference < 0) {
            //     dffMessage = "Sorry for the inconvenience. Reminders cannot be served in the past!";
            //     return { sendDff: true, message: this.dialogflowFullfillmentBody(dffMessage) };
            // }
            const whenDay = jsonFormat.StartDateTime.split("T")[0];
            const whenTime = jsonFormat.StartDateTime.split("T")[1];
            
            // const { whenDay, whenTime } =
            //     await this.generalReminderService.extractWhenDateTime(jsonFormat.StartDateTime);
            jsonFormat.WhenTime = TimeHelper.formatTimeTo_AM_PM(whenTime);
            let preposition = "on";
            let dateString = jsonFormat.DateString;
            if (frequency === "Daily") {
                preposition = "from";
            } else if (frequency === 'Weekly') {
                preposition = 'every';
                dateString = `${dayNames}`;
            }

            // const dffMessage = `Thank you for providing the name.
            // To confirm, you would like a medication reminder for *${medicineName}* at ${timeString}, correct?`;

            if (jsonFormat.TaskType === 'medication') {
                dffMessage = `Your medication 💊 reminder has been successfully set, and you will receive a ${this.generalReminderService.getfrequencyTerm(frequency)} notification at ${jsonFormat.TimeString} ${preposition} ${dateString}.`;
            }
            console.log(dffMessage);

            // await whatsappMetaButtonService("Yes","M_Medication_Data_Yes","No","M_Medication_Data_No");

            const response = await this.generalReminderService.createCommonReminders(eventObj, frequency, jsonFormat,
                jsonFormat.PatientUserId, whenDay, whenTime, personName, personPhoneNumber, dayNames );
            if (response.Status === 'failure') {
                dffMessage = `Sorry for the inconvenience. The reminder couldn't be set because the provided date and time cannot be in the past.`;
            }
            return await { sendDff: true, message: this.dialogflowFullfillmentBody(dffMessage) };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Medication reminder service error');
        }
    }

    async sendFrequencyButtons (eventObj: any ) {
        try {
            const message = "Please choose the frequency for your reminder.";
            const sessionId : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            let messageType = "";
            let payload = null;
            let channelName = eventObj.body.originalDetectIntentRequest.payload.source;
            const buttonArray = ["Once At Given Time", "Reminder_Frequency_Once" ,"Once Daily","Reminder_Frequency_Daily", "Weekly","Reminder_Frequency_Weekly"];
            if (channelName === 'whatsappMeta') {
                payload = await sendApiButtonService(buttonArray);
                messageType = 'interactivebuttons';
            } else {
                payload = await sendTelegramButtonService(buttonArray);
                messageType = 'inline_keyboard';
            }
            if (channelName === "telegram" || channelName === "Telegram") {
                channelName = "telegram";
            }
            payload["typeOfButton"] = "vertical";
            
            this._platformMessageService = eventObj.container.resolve(channelName);
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.sessionId = sessionId;
            response_format.messageText = message;
            response_format.message_type = messageType;

            await this._platformMessageService.SendMediaMessage(response_format, payload);
            return null;

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Medication reminder service error');
        }
    }

    public dialogflowFullfillmentBody(dffMessage: any) {
        return {
            "fulfillmentMessages" : [
                {
                    "text" : { "text": [dffMessage] }
                },
            ]
        };
    }

}
