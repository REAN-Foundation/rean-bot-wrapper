import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { GetPatientInfoService } from '../support.app.service';

@scoped(Lifecycle.ContainerScoped)
export class MedicationReminderService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,

    ){}

    async createReminder (eventObj) {
        try {
            const dayName : string = eventObj.body.queryResult.outputContexts[0].parameters.dayName;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const eventName : string = eventObj.body.queryResult.outputContexts[0].parameters.event;
            const frequency : string = eventObj.body.queryResult.outputContexts[0].parameters.frequency;
            const partOfDay : string = eventObj.body.queryResult.outputContexts[0].parameters.part_of_day;
            const time : string = eventObj.body.queryResult.outputContexts[0].parameters.time[0];

            // const result: any = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            // const patientUserId = result.message[0].UserId;
            // const name = result.message[0].DisplayName;
            // console.log(dayName,personPhoneNumber, eventName ,frequency, time);
            // const whenDay = await TimeHelper.getDateString(new Date(time), DateStringFormat.YYYY_MM_DD);
            // const whenTime = new Date(time).toISOString()
            //     .split('T')[1];

            const medicineName : string = eventObj.body.queryResult.outputContexts[1].parameters.medicineName;

            // const time = eventObj.body.queryResult.outputContexts[0].parameters["time.original"];
            // const dayName : string = eventObj.body.queryResult.outputContexts[0].parameters.dayName;

            // const dffMessage = `Hello ${personName}! \nI have successfully scheduled your 
            // medication reminder for *${medicineName}* every ${dayName} at ${time}.
            // You will receive the reminder at the specified time. If you have any further 
            // questions or need assistance in the future, feel free to ask.
            // \nTake care and stay healthy!`;

            // const url = null;
            // let apiURL = null;
            // let obj = {};
            // const hookUrl = "${reanBotBaseUrl}${client}/whatsappMeta/${urlToken}/send";
            
            // if (eventName === 'medication') {
            //     apiURL = ``;
            //     console.log("trigerring the medication reminder event");
            //     return await this.dialoflowMessageFormattingService.triggerIntent("M_Medication_Data",eventObj);
            // } else if (frequency === "once"){
            //     apiURL = `reminders/one-time`;
            //     obj = {
            //         "UserId"           : `${patientUserId}`,
            //         "Name"             : `${eventName}`,
            //         "WhenDate"         : `${whenDay}`,
            //         "WhenTime"         : `${whenTime}`,
            //         "HookUrl"          : `${hookUrl}`,
            //         "NotificationType" : "WhatsApp",
            //         "RawContent"       : ""
            //     };
            // } else if (frequency === "daily"){
            //     apiURL = `reminders/repeat-every-day`;
            //     obj = {
            //         "UserId"               : `${patientUserId}`,
            //         "Name"                 : `${eventName}`,
            //         "WhenDate"             : `${whenDay}`,
            //         "WhenTime"             : `${whenTime}`,
            //         "HookUrl"              : `${hookUrl}`,
            //         "NotificationType"     : "WhatsApp",
            //         "EndAfterNRepetitions" : 5,
            //         "RawContent"           : ""
            //     };
            // } else if (frequency === "every"){
            //     apiURL = `reminders/repeat-after-every-n`;
            //     obj = {
            //         "UserId"               : `${patientUserId}`,
            //         "Name"                 : `${eventName}`,
            //         "WhenDate"             : `${whenDay}`,
            //         "WhenTime"             : `${whenTime}`,
            //         "HookUrl"              : `${hookUrl}`,
            //         "EndAfterNRepetitions" : 5,
            //         "RepeatList"           : [
            //             dayName
            //         ],
            //         "NotificationType" : "WhatsApp",

            //         "RawContent" : ""
            //     };
            // }
            //Logger.instance().log(`object for reminders ${JSON.stringify(obj)}`);

            //await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

            const dffMessage = `Thank you for providing the name. To confirm, you would like a medication reminder for *${medicineName}* every ${dayName} at ${time}, correct?`;
            console.log(dffMessage);
            
            const payloadButtons = await whatsappMetaButtonService("Yes","M_Medication_Data_Yes","No","M_Medication_Data_No");
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
                .log_error(error.message,500,'Send success reminder creation error');
        }
    }

}