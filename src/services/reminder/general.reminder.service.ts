/* eslint-disable max-len */
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { GetPatientInfoService } from '../support.app.service';
import { DateStringFormat, DurationType, TimeHelper } from '../../common/time.helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { CacheMemory } from '../cache.memory.service';
import { ReminderBody, ReminderDomainModel, ReminderType, RepeatAfterEveryNUnit } from '../../domain.types/reminder/reminder.domain.model';
import { Registration } from '../registration/patient.registration.service';

@scoped(Lifecycle.ContainerScoped)
export class GeneralReminderService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(Registration) private registration?: Registration,

    ){}

    async createReminder (eventObj, obj, frequency, jsonFormat, whenDay,whenTime, personName?,
        personPhoneNumber?, dayName? ) {
        // try {
        //     let apiURL = null;
        //     let obj = {
        //         TaskName      : `${eventName} reminder`,
        //         TaskType      : eventName,
        //         Frequency     : frequency,
        //         DayName       : dayName,
        //         StartDateTime : `${date}T${updateTime}`,
        //         MedicineName  : null,
        //         PatientUserId : null,
        //         DateString    : dateString,
        //         TimeString    : timeString,
        //     }
        //     const channel = eventObj.body.originalDetectIntentRequest.payload.source;
        //     const hookUrl = "https://api.weatherstack.com/current?access_key=93fdf8204559b90ec79466809edb7aad&query=Pune";
        //     const rawData = this.getTemplateData(jsonFormat, personName, channel);
        //     obj["HookUrl"] = hookUrl;
        //     obj["RawContent"] = JSON.stringify(rawData)

        //     if (frequency === "Once" || frequency === ""){
        //         apiURL = `reminders/one-time`;

        //     } else if (frequency === "Daily"){
        //         apiURL = `reminders/repeat-every-day`;
        //         obj.EndAfterNRepetitions = 10;
        //         obj.ReminderType = ReminderType.RepeatEveryDay;

        //     } else if (frequency === "Weekly"){
        //         apiURL = `reminders/repeat-every-week-on-days`;
        //         if (dayName === '') {
        //             dayName = [TimeHelper.getWeekday(new Date(jsonFormat.StartDateTime), false)];
        //         }
        //         obj.ReminderType = ReminderType.RepeatEveryWeekday;
        //         obj.EndAfterNRepetitions = 12;
        //         obj.RepeatList = dayName;

        //     } else if (frequency === "Hourly"){
        //         apiURL = `reminders/repeat-every-hour`;
        //         obj.ReminderType = ReminderType.RepeatEveryHour;
        //         obj.EndAfterNRepetitions = 10;
                
        //     } else if (frequency === "Yearly"){
        //         apiURL = `reminders/repeat-after-every-n`;
        //         obj.ReminderType = ReminderType.RepeatAfterEveryN;
        //         obj.EndAfterNRepetitions = 3;
        //         obj.RepeatAfterEvery = 1;
        //         obj.RepeatAfterEveryNUnit = RepeatAfterEveryNUnit.Year;
                
        //     } else if (frequency === "Quarterly"){
        //         apiURL = `reminders/repeat-every-quarter-on`;
        //         obj.ReminderType = ReminderType.RepeatEveryQuarterOn;
        //         obj.EndAfterNRepetitions = 5;
                
        //     } else if (frequency === "WeekDays"){
        //         apiURL = `reminders/repeat-every-weekday`;
        //         obj.EndAfterNRepetitions = 8;
                
        //     } else if (frequency === "Monthly"){
        //         apiURL = `reminders/repeat-every-month-on`;
        //         obj.EndAfterNRepetitions = 6;
                
        //     }
        //     obj.StartDate = whenDay;
        //     const data = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
        //     return data;

        // } catch (error) {
        //     Logger.instance()
        //         .log_error(error.message,500,'create general reminder service error');
        // }
    }

    async createReminderN(eventObj){
        // const botData = eventObj.body.data.bot
        const channel = eventObj.body.payload.platform
        const personPhoneNumber = eventObj.body.payload.platformId
        const personName = eventObj.body.payload.name
        const patientUserId = await this.registration.getPatientUserId(channel,
            personPhoneNumber, personName);
        const hookUrl = "https://api.weatherstack.com/current?access_key=93fdf8204559b90ec79466809edb7aad&query=Pune";
        const rawData = this.getTemplateData(eventObj);
        let apiURL = ""
        let obj = {
            "UserId": patientUserId,
            "Name": eventObj.body.data.bot.ReminderType,
            "WhenDate": eventObj.body.data.bot.whenDate,
            "WhenTime": eventObj.body.data.bot.whenTime,
            "HookUrl": hookUrl,
            "NotificationType": "WhatsApp",
            "RawContent": rawData
            
        }
        if ( eventObj.body.data.bot.frequency.hasOwnProperty('oneTime') ) {
            apiURL = `reminders/one-time`;
        }
        else if (eventObj.body.data.bot.frequency.hasOwnProperty('onceDaily') ) {
            apiURL = `reminders/repeat-every-day`;
            obj["EndAfterNRepetitions"] = 10;
            obj["ReminderType"] = ReminderType.RepeatEveryDay
        }
        else if ( eventObj.body.data.bot.frequency.hasOwnProperty('weekly') ) {
            if ( eventObj.body.data.bot.frequency.weekly.option.hasOwnProperty('all_days') ) {
                apiURL = `reminders/repeat-every-weekday`;
                obj["ReminderType"] = ReminderType.RepeatEveryWeekday;
                obj["EndAfterNRepetitions"] = 12;
                
            }
            else {
                apiURL = `reminders/repeat-every-week-on-days`;
                obj["ReminderType"] = ReminderType.RepeatEveryWeekday;
                obj["EndAfterNRepetitions"] = 12;
                obj["RepeatList"] = eventObj.body.data.bot.frequency.weekly.option.specific_days;
            }

        }
        else if( eventObj.body.data.bot.frequency.hasOwnProperty('MonthlyReminder') ){
            apiURL = `reminders/repeat-every-month-on`;
            obj["EndAfterNRepetitions"] = 6;
        }
        else{
            throw new Error("This frequency is not yet setup")
        }
        
        const data = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
        return data;
    }

    private getTemplateData(jsonFormat) {
        const data = jsonFormat.body.data.bot
        const channel = jsonFormat.body.payload.platform
        const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
        const fourthVariable = data.ReminderType === 'Medication' ? 'take your medicine' : 'attend your appointment';
        let variables = null;
        let templateName = "appointment_rem_question";

        const commonStructure: any = [
            {
                "type" : "text",
                "text" : "Patient_name"
            },
            {
                "type" : "text",
                "text" : data.ReminderType
            },
            {
                "type" : "text",
                "text" : data.whenTime
            },
            {
                "type" : "text",
                "text" : fourthVariable
            }
        ];

        const kannadaVariables =  [
            {
                "type" : "text",
                "text" : jsonFormat.body.payload.name
            },
            {
                "type" : "text",
                "text" : data.whenTime
            },
            {
                "type" : "text",
                "text" : data.ReminderType
            }
        ];

        if (channel === "whatsappWati") {
            templateName = "reminder_message";
            commonStructure[0].name = "patient_name";
            commonStructure[1].name = "task_name";
            commonStructure[2].name = "time_string";
            commonStructure[3].name = "fourth_variable";
        }

        variables = { en: commonStructure, kn: kannadaVariables, sw: commonStructure };
        const buttonsIds = data.ReminderType === 'Medication' ? [ "App_Reminder_Yes", "Medication_Taken_No" ] : [ "App_Reminder_Yes", "App_Reminder_No"] ;

        return {
            TemplateName : templateName,
            Variables    : variables,
            ButtonsIds   : buttonsIds,
            ClientName   : clientName,
            TextMessage  : `Hi ${jsonFormat.body.payload.name}, \nYou have ${data.ReminderType} scheduled at ${data.whenTime}. Will you be able to ${fourthVariable}?`
        };
    }

}
