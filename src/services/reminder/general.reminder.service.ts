/* eslint-disable max-len */
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiButtonService } from '../whatsappmeta.button.service';
import { GetPatientInfoService } from '../support.app.service';
import { DateStringFormat, TimeHelper } from '../../common/time.helper';
import { OpenAIResponseService } from '../openai.response.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { CacheMemory } from '../cache.memory.service';
import { NotificationType, ReminderDomainModel, ReminderType, RepeatAfterEveryNUnit } from '../../domain.types/reminder/reminder.domain.model';
import dayjs from 'dayjs';

@scoped(Lifecycle.ContainerScoped)
export class GeneralReminderService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,
        @inject(OpenAIResponseService) private openAIResponseService?: OpenAIResponseService,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,

    ){}

    async createReminder (eventObj) {
        try {
            let dayName : string = eventObj.body.queryResult.parameters.dayName;
            const message : string = eventObj.body.queryResult.queryText;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const eventName : string = eventObj.body.queryResult.parameters.event;
            let frequency : string = eventObj.body.queryResult.parameters.frequency;
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;

            //const time : string = eventObj.body.queryResult.parameters.time[0];
            const timeString = eventObj.body.queryResult.outputContexts[0].parameters["time.original"];
            const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");

            const openAiResponse: any = await this.openAIResponseService.getOpenaiMessage(clientName, message);
            let jsonFormat = openAiResponse;
            jsonFormat = JSON.parse(jsonFormat.response.data.choices[0].text);
            const phoneNumber = await this.needleService.getPhoneNumber(eventObj);

            // extract patient data and set to catch memory
            const result: any = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            const patientUserId = result.message[0].UserId;
            jsonFormat.PatientUserId = patientUserId;
            await CacheMemory.set(phoneNumber, jsonFormat);

            //check is it array
            let time = null;
            if (!Array.isArray(jsonFormat)) {
                if (this.isTimestampValid(jsonFormat.StartDateTime)) {
                    time = new Date(jsonFormat.StartDateTime);
                    const timeDifference = TimeHelper.dayDiff(new Date(), time);
                    if (timeDifference > 0) {
                        return await this.dialoflowMessageFormattingService.triggerIntent("Reminder_Ask_Time",eventObj);
                    }
                    console.log(time);
                
                } else if (this.attachTimeToToday(jsonFormat.StartDateTime) != null) {
                    time = this.attachTimeToToday(jsonFormat.StartDateTime);
                    console.log(time);
                } else if (!time) {
                    console.log(`triggering Reminder_Ask_Time intent`);
                    return await this.dialoflowMessageFormattingService.triggerIntent("Reminder_Ask_Time",eventObj);
                }

            }
            console.log(`Json message format ${jsonFormat.TaskName}, ${jsonFormat.TaskType}, ${jsonFormat.StartDateTime}`);
            frequency = jsonFormat.Frequency;
            dayName = jsonFormat.DayName;

            //const name = result.message[0].DisplayName;

            // extract whentime and whenday from schedule timestamp
            const { whenDay, whenTime } = await this.extractWhenDateTime(time);
            
            if (jsonFormat.TaskType === 'Medication') {
                console.log("trigerring the medication reminder event");
                return await this.dialoflowMessageFormattingService.triggerIntent("M_Medication_Data",eventObj);

            } else {
                await this.createCommonReminders(eventObj, frequency, jsonFormat, patientUserId, whenDay, whenTime, personName,
                    personPhoneNumber, dayName );
            }

            //return { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Send success reminder creation error');
        }
    }

    public async extractWhenDateTime(time: any) {
        let whenDay = null;
        let whenTime = null;
        if (time) {
            whenDay = await TimeHelper.getDateString(new Date(time), DateStringFormat.YYYY_MM_DD);
            whenTime = await this.extarctTimeFromTimeStamp(time);
        } else {
            whenDay = await TimeHelper.getDateString(new Date(), DateStringFormat.YYYY_MM_DD);
            whenTime = await this.extarctTimeFromTimeStamp(new Date());
        }
        return { whenDay, whenTime };
    }

    async createCommonReminders (eventObj, frequency, jsonFormat, patientUserId, whenDay, whenTime, personName?,
        personPhoneNumber?, dayName? ) {
        try {
            let apiURL = null;
            const hookUrl = "https://api.weatherstack.com/current?access_key=93fdf8204559b90ec79466809edb7aad&query=Pune";
            if (frequency === "Once"){
                apiURL = `reminders/one-time`;
                const rawData = this.getTemplateData(jsonFormat);

                const obj = this.getCommonReminderBody(patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
                await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

                const data = await this.getFulfillmentMsg(jsonFormat, frequency, whenTime);
                this.sendDemoReminder(personName, personPhoneNumber, whenTime, dayName, jsonFormat, eventObj);
                return data;

            } else if (frequency === "Daily"){
                apiURL = `reminders/repeat-every-day`;

                const rawData = this.getTemplateData(jsonFormat);
                const obj = this.getCommonReminderBody(patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
                obj.EndAfterNRepetitions = 5;
                obj.ReminderType = ReminderType.RepeatEveryDay;
                await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

                const data = await this.getFulfillmentMsg(jsonFormat, frequency, whenTime);
                this.sendDemoReminder(personName, personPhoneNumber, whenTime, dayName, jsonFormat, eventObj);
                return data;
            } else if (frequency === "Weekly"){
                apiURL = `reminders/repeat-every-week-on-days`;

                const rawData = this.getTemplateData(jsonFormat);
                const obj = this.getCommonReminderBody(patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
                obj.ReminderType = ReminderType.RepeatEveryWeekday;
                obj.EndAfterNRepetitions = 5;
                obj.RepeatList = [ dayName ];
                await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

                const data = await this.getFulfillmentMsg(jsonFormat, frequency, whenTime);
                this.sendDemoReminder(personName, personPhoneNumber, whenTime, dayName, jsonFormat, eventObj);

                return data;
            } else if (frequency === "Hourly"){
                apiURL = `reminders/repeat-every-hour`;

                const rawData = this.getTemplateData(jsonFormat);
                const obj = this.getCommonReminderBody(patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
                obj.ReminderType = ReminderType.RepeatEveryHour;
                obj.EndAfterNRepetitions = 5;
                obj.StartDate = whenDay;
                await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

                const data = await this.getFulfillmentMsg(jsonFormat, frequency, whenTime);
                this.sendDemoReminder(personName, personPhoneNumber, whenTime, dayName, jsonFormat, eventObj);

                return data;
            } else if (frequency === "Yearly"){
                apiURL = `reminders/repeat-after-every-n`;

                const rawData = this.getTemplateData(jsonFormat);
                const obj = this.getCommonReminderBody(patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
                obj.ReminderType = ReminderType.RepeatAfterEveryN;
                obj.EndAfterNRepetitions = 5;
                obj.StartDate = whenDay;
                obj.RepeatAfterEvery = 1;
                obj.RepeatAfterEveryNUnit = RepeatAfterEveryNUnit.Year;
                await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

                const data = await this.getFulfillmentMsg(jsonFormat, frequency, whenTime);
                this.sendDemoReminder(personName, personPhoneNumber, whenTime, dayName, jsonFormat, eventObj);
                return data;
                
            } else if (frequency === "Quarterly"){
                apiURL = `repeat-every-quarter-on`;

                const rawData = this.getTemplateData(jsonFormat);
                const obj = this.getCommonReminderBody(patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
                obj.ReminderType = ReminderType.RepeatEveryQuarterOn;
                obj.EndAfterNRepetitions = 5;
                obj.StartDate = whenDay;
                await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

                const data = await this.getFulfillmentMsg(jsonFormat, frequency, whenTime);
                this.sendDemoReminder(personName, personPhoneNumber, whenTime, dayName, jsonFormat, eventObj);

                return data;
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    private getTemplateData(jsonFormat: any) {
        return {
            TemplateName : "reminder_template_1",
            Variables    : {
                en : [{
                    "type" : "text",
                    "text" : jsonFormat.TaskName
                },
                {
                    "type" : "text",
                    "text" : "have fever,"
                },
                {
                    "type" : "text",
                    "text" : "or start shaking"
                }]
            },
            ButtonIds : ["button_1", "button_2"]
        };
    }

    private sendDemoReminder(personName: string, personPhoneNumber: string, whenTime: any, dayName: string, jsonFormat: any, eventObj: any) {
        const body: QueueDoaminModel = {
            Intent : "General_Reminder",
            Body   : {
                PersonName        : personName,
                PersonPhoneNumber : personPhoneNumber,
                Time              : whenTime,
                DayName           : dayName,
                TaskName          : jsonFormat.TaskName,
                EventObj          : eventObj
            }
        };
        FireAndForgetService.enqueue(body);
    }

    private getFulfillmentMsg(jsonFormat: any, frequency: string, whenTime: any) {
        const dffMessage = `We are processing your request, with event ${jsonFormat.TaskName} that is scheduled for ${frequency} at ${whenTime}`;
        const data = {
            "fulfillmentMessages" : [
                {
                    "text" : { "text": [dffMessage] }
                }
            ]
        };
        return data;
    }

    private getCommonReminderBody(patientUserId: string, taskName: string, whenDay: any, whenTime: any, hookUrl: string, rawContent: any) {
        const obj: ReminderDomainModel = {
            "UserId"           : `${patientUserId}`,
            "ReminderType"     : ReminderType.OneTime,
            "Name"             : `${taskName}`,
            "WhenDate"         : `${whenDay}`,
            "WhenTime"         : `${whenTime}`,
            "HookUrl"          : `${hookUrl}`,
            "NotificationType" : NotificationType.WhatsApp,
            "RawContent"       : JSON.stringify(rawContent)
        };
        return obj;
    }

    attachTimeToToday(time: string): Date | null {

        // Split the provided time into hours, minutes, and seconds
        const [hours, minutes, seconds] = time.split(':').map(Number);
        if (minutes == null || hours == null) {
            return null;
        }
        const today = new Date();
        today.setHours(hours);
        today.setMinutes(minutes);
        today.setSeconds(seconds);
        return today;
    }

    isTimestampValid(timestamp: string): boolean {
        const date = new Date(timestamp);

        // Check if the parsed date is valid and not equal to "Invalid Date"
        return !isNaN(date.getTime()) && date.toString() !== "Invalid Date";
    }

    async sendReminder (body, eventObj) {
        try {
            const message = `Dear ${body.PersonName},

            I hope this message finds you well. I wanted to remind you about the upcoming event *${body.TaskName}* that is scheduled at *${body.Time}*. 
            Your prompt attention to this reminder is greatly appreciated. \nTake care and see you soon!
            \nRegards\nREAN Foundation`;

            // const payload = {};

            // payload["buttonIds"] = await templateButtonService(["Schedule_Donation","NeedBlood_Patient_ByMistake"]);

            // payload["variables"] = [
            //     {
            //         type : "text",
            //         text : body.VolunteerName
            //     },
            //     {
            //         type : "text",
            //         text : body.PatientName
            //     }];
            // payload["templateName"] = "need_blood_notify_volunteer";
            // payload["languageForSession"] = "en";
            await FireAndForgetService.delay(4000);
            const previousPayload = eventObj.body.originalDetectIntentRequest.payload;
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = previousPayload.source;
            response_format.sessionId = body.PersonPhoneNumber;
            response_format.messageText = message;
            response_format.message_type = "text";

            this._platformMessageService = eventObj.container.resolve(previousPayload.source);
            await this._platformMessageService.SendMediaMessage(response_format, null);
            
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    async extarctTimeFromTimeStamp(timeStamp ) {
        const now = new Date(timeStamp); // Create a Date object representing the current date and time
        const hours = String(now.getHours()).padStart(2, '0'); // Extract hours and format it with leading zero if necessary
        const minutes = String(now.getMinutes()).padStart(2, '0'); // Extract minutes and format it with leading zero if necessary
        const seconds = String(now.getSeconds()).padStart(2, '0'); // Extract seconds and format it with leading zero if necessary

        return `${hours}:${minutes}:${seconds}`; // Create the HH:MM:SS format string
    }

}