import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { CacheMemory } from '../cache.memory.service';
import { GeneralReminderService } from './general.reminder.service';
import { OpenAIResponseService } from '../openai.response.service';

@scoped(Lifecycle.ContainerScoped)
export class ReminderAskTimeService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,
        @inject(GeneralReminderService) private generalReminderService?: GeneralReminderService,
        @inject(OpenAIResponseService) private openAIResponseService?: OpenAIResponseService,

    ){}

    async createReminder (eventObj) {
        try {

            // const message : string = eventObj.body.queryResult.queryText;
            let time = eventObj.body.queryResult.parameters.time;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const timeString = eventObj.body.queryResult.outputContexts[0].parameters["time.original"];
            const phoneNumber : any = await this.needleService.getPhoneNumber(eventObj);
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const message : string = eventObj.body.queryResult.queryText;

            const clientName = "REMINDERS_ASK_TIME";
            const openAiResponse: any = await this.openAIResponseService.getOpenaiMessage(clientName, message);
            time = JSON.parse(openAiResponse.getText());
            if (time.DateTime) {
                time = time.DateTime;
            }
            time = await this.generalReminderService.updateReminderTimeWithMessage(message, time);

            const jsonFormat = await CacheMemory.get(phoneNumber);
            jsonFormat.StartDateTime = time;
            jsonFormat.TimeString = timeString;
            await CacheMemory.set(phoneNumber, jsonFormat);
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
                .log_error(error.message,500,'Ask time reminder service error');
        }
    }
}
