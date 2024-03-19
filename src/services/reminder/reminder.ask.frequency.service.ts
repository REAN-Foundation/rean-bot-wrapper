import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { GetPatientInfoService } from '../support.app.service';
import { GeneralReminderService } from './general.reminder.service';
import { CacheMemory } from '../cache.memory.service';
import { TimeHelper } from '../../common/time.helper';

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
            
            const { whenDay, whenTime } =
                await this.generalReminderService.extractWhenDateTime(jsonFormat.StartDateTime);
            jsonFormat.WhenTime = TimeHelper.formatTimeTo_AM_PM(whenTime);
            let preposition = "on";
            if (frequency !== "Once" && frequency !== "") {
                preposition = "from";
            }

            // const dffMessage = `Thank you for providing the name.
            // To confirm, you would like a medication reminder for *${medicineName}* at ${timeString}, correct?`;

            if (jsonFormat.TaskType === 'medication') {
                dffMessage = `Your medication 💊 reminder has been successfully set, and you will receive a ${this.generalReminderService.getfrequencyTerm(frequency)} notification at ${jsonFormat.TimeString} ${preposition} ${jsonFormat.DateString}.`;
            }
            console.log(dffMessage);

            // await whatsappMetaButtonService("Yes","M_Medication_Data_Yes","No","M_Medication_Data_No");

            const response = await this.generalReminderService.createCommonReminders(eventObj, frequency, jsonFormat,
                jsonFormat.PatientUserId, whenDay, whenTime, personName, personPhoneNumber, jsonFormat.DayName );
            if (response.Status === 'failure') {
                dffMessage = `Sorry for the inconvenience. The reminder couldn't be set because the provided date and time cannot be in the past.`;
            }
            return await { sendDff: true, message: this.dialogflowFullfillmentBody(dffMessage) };

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
