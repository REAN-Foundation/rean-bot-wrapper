import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { GetPatientInfoService } from '../support.app.service';
import { GeneralReminderService } from './general.reminder.service';
import { CacheMemory } from '../cache.memory.service';

@scoped(Lifecycle.ContainerScoped)
export class MedicationReminderService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GeneralReminderService) private generalReminderService?: GeneralReminderService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,

    ){}

    async createReminder (eventObj) {
        try {
            const dayName : string = eventObj.body.queryResult.outputContexts[0].parameters.dayName;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const eventName : string = eventObj.body.queryResult.outputContexts[0].parameters.event;
            const partOfDay : string = eventObj.body.queryResult.outputContexts[0].parameters.part_of_day;
            const phoneNumber : any = await this.needleService.getPhoneNumber(eventObj);
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const time : string = eventObj.body.queryResult.outputContexts[0].parameters.time;
            const timeString : string = eventObj.body.queryResult.outputContexts[0].parameters["time.original"];

            // const result: any = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            // const patientUserId = result.message[0].UserId;
            // const name = result.message[0].DisplayName;
            // console.log(dayName,personPhoneNumber, eventName ,frequency, time);
            // const whenDay = await TimeHelper.getDateString(new Date(time), DateStringFormat.YYYY_MM_DD);
            // const whenTime = new Date(time).toISOString()
            //     .split('T')[1];

            const medicineName : string = eventObj.body.queryResult.outputContexts[1].parameters.medicineName;
            const jsonFormat = await CacheMemory.get(phoneNumber);
            jsonFormat.StartDateTime = time;
            const { whenDay, whenTime } = await this.generalReminderService.extractWhenDateTime(time);

            const dffMessage = `Thank you for providing the name. To confirm, you would like a medication reminder for *${medicineName}* at ${timeString}, correct?`;
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
            await this.generalReminderService.createCommonReminders(eventObj, "Once", jsonFormat,
                jsonFormat.PatientUserId, whenDay, whenTime, personName, personPhoneNumber, jsonFormat.DayName );
            return await { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Send success reminder creation error');
        }
    }

}