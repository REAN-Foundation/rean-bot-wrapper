import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { GetPatientInfoService } from '../support.app.service';
import { CacheMemory } from '../cache.memory.service';
import { GeneralReminderService } from './general.reminder.service';

@scoped(Lifecycle.ContainerScoped)
export class ReminderAskTimeService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,
        @inject(GeneralReminderService) private generalReminderService?: GeneralReminderService,

    ){}

    async createReminder (eventObj) {
        try {

            // const message : string = eventObj.body.queryResult.queryText;
            let time = eventObj.body.queryResult.parameters.time;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const timeString = eventObj.body.queryResult.outputContexts[0].parameters["time.original"];
            const phoneNumber : any = await this.needleService.getPhoneNumber(eventObj);
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;

            if (time.date_time) {
                time = time.date_time;
            }
            const jsonFormat = await CacheMemory.get(phoneNumber);
            jsonFormat.StartDateTime = time;
            jsonFormat.TimeString = timeString;

            // if (!Array.isArray(jsonFormat)) {

            // }
            console.log(`Json message format ${jsonFormat.TaskName}, ${jsonFormat.TaskType}, ${jsonFormat.StartDateTime}`);
            const frequency = jsonFormat.Frequency;

            // extract whentime and whenday from schedule timestamp
            const { whenDay, whenTime } = await this.generalReminderService.extractWhenDateTime(time);
            
            if (jsonFormat.TaskType === 'medication' || jsonFormat.TaskType === 'appointment') {
                console.log("trigerring the medication reminder intent");
                return await this.dialoflowMessageFormattingService.triggerIntent("M_Medication_Data",eventObj);

            } else {
                await this.generalReminderService.createCommonReminders(eventObj, frequency, jsonFormat,
                    jsonFormat.PatientUserId, whenDay, whenTime, personName, personPhoneNumber, jsonFormat.DayName );
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Send success reminder creation error');
        }
    }

}
