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
import { DateStringFormat, DurationType, TimeHelper } from '../../common/time.helper';
import { OpenAIResponseService } from '../openai.response.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { CacheMemory } from '../cache.memory.service';
import { NotificationType, ReminderBody, ReminderDomainModel, ReminderType, RepeatAfterEveryNUnit } from '../../domain.types/reminder/reminder.domain.model';
import dayjs from 'dayjs';
import { AppointmentReminderService } from './appointment.reminder.service';

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
            const dayName : string = eventObj.body.queryResult.parameters.dayName;
            const message : string = eventObj.body.queryResult.queryText;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const eventName : string = eventObj.body.queryResult.parameters.event;
            const frequency : string = eventObj.body.queryResult.parameters.frequency;
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const channel = eventObj.body.originalDetectIntentRequest.payload.source;

            const dialogflowDateTime = eventObj.body.queryResult.parameters.dateTime;
            let dffMessage = "";

            const jsonFormat: ReminderBody = {
                TaskName      : `${eventName} reminder`,
                TaskType      : eventName,
                Frequency     : frequency !== "" ? frequency : "Once" ,
                DayName       : dayName,
                StartDateTime : dialogflowDateTime.date_time,
                MedicineName  : null,
                PatientUserId : null,
            };

            // jsonFormat = JSON.parse(openAiResponse.getText());
            const phoneNumber = await this.needleService.getPhoneNumber(eventObj);

            // extract patient data and set to catch memory
            const patientUserId = await this.getPatientInfoService.getPatientUserId(channel,
                personPhoneNumber, personName);
            jsonFormat.PatientUserId = patientUserId;
            jsonFormat.TaskName = `${eventName} reminder`;
            console.log(jsonFormat);
            await CacheMemory.set(phoneNumber, jsonFormat);

            // extract whentime and whenday from schedule timestamp
            const { whenDay, whenTime } = await this.extractWhenDateTime(jsonFormat.StartDateTime);
            
            if (jsonFormat.TaskType === 'medication') {
                console.log(`trigerring the ${jsonFormat.TaskType} reminder event`);
                return await this.dialoflowMessageFormattingService.triggerIntent("M_Medication_Data",eventObj);

            } else {
                const response = await this.createCommonReminders(eventObj, jsonFormat.Frequency, jsonFormat, patientUserId, whenDay, whenTime, personName,
                    personPhoneNumber, dayName );
                if (response.Status === 'failure') {
                    dffMessage = `Sorry for the inconvenience. I could not create the reminder due to ${response.Message}`;
                } else {
                    dffMessage = `Your ${jsonFormat.TaskType} reminder has been successfully set, and you will receive a notification at the scheduled time.`;
                }
            }
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    }
                ]
            };

            return data ;

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Send success general reminder creation error');
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
            const channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const hookUrl = "https://api.weatherstack.com/current?access_key=93fdf8204559b90ec79466809edb7aad&query=Pune";
            if (frequency === "Once"){
                apiURL = `reminders/one-time`;
                const rawData = this.getTemplateData(jsonFormat, personName);

                const obj = this.getCommonReminderBody(channel, patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
                const data = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

                // const data = await this.getFulfillmentMsg(jsonFormat, frequency, whenTime);
                return data;

            } else if (frequency === "Daily"){
                apiURL = `reminders/repeat-every-day`;

                const rawData = this.getTemplateData(jsonFormat);
                const obj = this.getCommonReminderBody(channel, patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
                obj.EndAfterNRepetitions = 10;
                obj.ReminderType = ReminderType.RepeatEveryDay;
                obj.StartDate = whenDay;
                const data = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

                return data;
            } else if (frequency === "Weekly"){
                apiURL = `reminders/repeat-every-week-on-days`;

                const rawData = this.getTemplateData(jsonFormat);
                const obj = this.getCommonReminderBody(channel, patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
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
                const obj = this.getCommonReminderBody(channel, patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
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
                const obj = this.getCommonReminderBody(channel, patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
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
                const obj = this.getCommonReminderBody(channel, patientUserId, jsonFormat.TaskName, whenDay, whenTime, hookUrl, rawData);
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
                .log_error(error.message,500,'create general reminder service error');
        }
    }

    public getReminderType( channel: string) {
        const channelType = {
            "whatsappMeta" : NotificationType.WhatsApp,
            "telegram"     : NotificationType.Telegram,
            "Telegram"     : NotificationType.Telegram,
        };
        return channelType[channel] ?? NotificationType.WhatsApp;
    }

    private getTemplateData(jsonFormat: any, personName? ) {
        const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
        const fourthVariable = jsonFormat.TaskType === 'medication' ? 'take your medicine' : 'attend your appointment';
        return {
            TemplateName : "appointment_rem_question",
            Variables    : {
                en : [{
                    "type" : "text",
                    "text" : "Patient_name"
                },
                {
                    "type" : "text",
                    "text" : jsonFormat.TaskName
                },
                {
                    "type" : "text",
                    "text" : jsonFormat.WhenTime
                },
                {
                    "type" : "text",
                    "text" : fourthVariable
                }]
            },
            ButtonsIds  : [ "App_Reminder_Yes", "App_Reminder_No"],
            ClientName  : clientName,
            TextMessage : `Hi ${personName}, \nYou have ${jsonFormat.TaskName} scheduled at ${jsonFormat.WhenTime}. Will you be able to ${fourthVariable}?`
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

    private getCommonReminderBody(channel: string, patientUserId: string, taskName: string, whenDay: any, whenTime: any, hookUrl: string, rawContent: any) {

        const obj: ReminderDomainModel = {
            "UserId"           : `${patientUserId}`,
            "ReminderType"     : ReminderType.OneTime,
            "Name"             : `${taskName}`,
            "WhenDate"         : `${whenDay}`,
            "WhenTime"         : `${whenTime}`,
            "HookUrl"          : `${hookUrl}`,
            "NotificationType" : this.getReminderType(channel),
            "RawContent"       : JSON.stringify(rawContent)
        };
        return obj;
    }

    isTimestampValid(timestamp: string): boolean {
        const date = new Date(timestamp);

        // Check if the parsed date is valid and not equal to "Invalid Date"
        return !isNaN(date.getTime()) && date.toString() !== "Invalid Date";
    }

    async extarctTimeFromTimeStamp(timeStamp ) {

        const time = timeStamp.split("T")[1];
        const subtime = time.split(":", 2);
        return `${subtime[0]}:${subtime[1]}:00`; // Create the HH:MM:SS format string
    }

    async updateReminderTimeWithMessage(message: string, time: any) {
        const messageLowerCase = message.toLowerCase();
        const timeDifference = TimeHelper.dayDiff(new Date(time), new Date());
        if (timeDifference < 0) {
            let currentDate = null;
            const userTime = time.split('T')[1];
            if (messageLowerCase.includes('tomorrow') || messageLowerCase.includes('tomorow')) {
                currentDate = TimeHelper.addDuration(new Date(), 1, DurationType.Day);
            } else if (messageLowerCase.includes('day after tomorrow') || messageLowerCase.includes('next tomorrow')) {
                currentDate = TimeHelper.addDuration(new Date(), 2, DurationType.Day);
            } else {
                currentDate = new Date();
            }
            let formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${currentDate.getDate().toString()
                .padStart(2, '0')}`;
            formattedDate = formattedDate + `T${userTime}`;
            time = formattedDate;
        }
        return time;
    }

}
