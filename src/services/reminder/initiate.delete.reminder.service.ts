import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { Registration } from '../registration/patient.registration.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiInteractiveListService } from '../whatsappmeta.button.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { sendTelegramButtonService } from '../telegram.button.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { CacheMemory } from '../cache.memory.service';

@scoped(Lifecycle.ContainerScoped)
export class InitiateDeleteReminderService {

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(Registration) private registration?: Registration

    ){}

    private _platformMessageService :  platformServiceInterface = null;

    async initiateDelete (eventObj) {
        try {
            const sessionId : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const userName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            let messageType = "";
            let payload = null;
            let channelName = eventObj.body.originalDetectIntentRequest.payload.source;
            const patientUserId = await this.registration.getPatientUserId(channelName,
                sessionId, userName);

            let message = null;
            const getreminderurl = `reminders/search?userId=${patientUserId}`;
            const responseBody = await this.needleService.needleRequestForREAN("get", getreminderurl);
            const listOfReminders = responseBody.Data.Reminders.Items;
            if (listOfReminders.length > 0) {
                let reminderTypeButtonArray = [];
                for (const reminder of listOfReminders) {
                    reminderTypeButtonArray.push(reminder.Name);
                }
                reminderTypeButtonArray = [...new Set(reminderTypeButtonArray)];
                const uniqueReminderTypeButtonArrays = [];
                for (let i = 0; i < reminderTypeButtonArray.length; i++){
                    uniqueReminderTypeButtonArrays.push(reminderTypeButtonArray[i]);
                    uniqueReminderTypeButtonArrays.push("delete_reminder_type" + String(i));
                }
                if (channelName === 'whatsappMeta') {
                    payload = await sendApiInteractiveListService(uniqueReminderTypeButtonArrays);
                    messageType = 'interactivelist';
                } else if (channelName === "telegram" || channelName === "Telegram"){
                    payload = await sendTelegramButtonService(uniqueReminderTypeButtonArrays);
                    messageType = 'inline_keyboard';
                    channelName = "telegram";
                }
                else {
                    throw new Error(`channel method not implemented: ${channelName}`);
                }
                payload["typeOfButton"] = "vertical";
                this._platformMessageService = eventObj.container.resolve(channelName);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.sessionId = sessionId;
                response_format.messageText = "Select the type of reminder you want to delete";
                response_format.message_type = messageType;
                await this._platformMessageService.SendMediaMessage(response_format, payload);
                return "Getting your reminders";
            } else {
                message = `Hi ${userName}, \nIt seems like you don't have any reminders set at the moment`;
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : { "text": [message] }
                        }
                    ]
                };
                return data;
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Ask time reminder service error');
        }
    }

    async getReminderDetails (eventObj) {
        try {
            const sessionId : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const userName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const messageBody : string = eventObj.body.originalDetectIntentRequest.payload.completeMessage.messageBody;
            let messageType = "";
            let payload = null;
            let channelName = eventObj.body.originalDetectIntentRequest.payload.source;
            const patientUserId = await this.registration.getPatientUserId(channelName,
                sessionId, userName);
            let message = null;
            const getreminderurl = `reminders/search?userId=${patientUserId}&name=${messageBody}`;
            const responseBody = await this.needleService.needleRequestForREAN("get", getreminderurl);
            const listOfReminders = responseBody.Data.Reminders.Items;
            if (listOfReminders.length > 0) {
                const buttonArray = [];
                for (const reminder of listOfReminders) {
                    if (channelName !== 'whatsappMeta'){
                        if (reminder.WhenDate !== null){
                            buttonArray.push(reminder.ReminderType + ', ' + reminder.WhenDate + ', ' + reminder.WhenTime);
                        }
                        else {
                            buttonArray.push(reminder.ReminderType + ', ' + reminder.WhenTime);
                        }
                    }
                    else {
                        buttonArray.push(reminder.ReminderType);
                        if (reminder.WhenDate !== null){
                            buttonArray.push(reminder.WhenDate + ', ' + reminder.WhenTime);
                        }
                        else {
                            buttonArray.push(reminder.WhenTime);
                        }
                    }
                    
                }
                CacheMemory.set(sessionId,{ reminderName: messageBody});
                const uniqueuttonArrays = [];
                if (channelName === 'whatsappMeta'){
                    for (let i = 0; i < buttonArray.length; i += 2){
                        uniqueuttonArrays.push(buttonArray[i]);
                        uniqueuttonArrays.push(buttonArray[i + 1]);
                        uniqueuttonArrays.push("delete_reminder_time" + String(i));
                    }
                }
                else {
                    for (let i = 0; i < buttonArray.length; i++){
                        uniqueuttonArrays.push(buttonArray[i]);
                        uniqueuttonArrays.push("delete_reminder_time" + String(i));
                    }
                }
                if (channelName === 'whatsappMeta') {
                    payload = await sendApiInteractiveListService(uniqueuttonArrays,true);
                    messageType = 'interactivelist';
                } else if (channelName === "telegram" || channelName === "Telegram"){
                    payload = await sendTelegramButtonService(uniqueuttonArrays);
                    messageType = 'inline_keyboard';
                    channelName = "telegram";
                }
                else {
                    throw new Error(`channel method not implemented: ${channelName}`);
                }
                payload["typeOfButton"] = "vertical";
                this._platformMessageService = eventObj.container.resolve(channelName);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.sessionId = sessionId;
                response_format.messageText = `select the ${messageBody} you want to delete`;
                response_format.message_type = messageType;
                await this._platformMessageService.SendMediaMessage(response_format, payload);
                return `Getting your ${messageBody}`;
            } else {
                message = `Hi ${userName}, \nIt seems like you don't have any ${messageBody} set at the moment`;
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : { "text": [message] }
                        }
                    ]
                };
                return data;
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'initiate delete reminder service error');
        }
    }

    async deleteRemider (eventObj) {
        try {
            const sessionId : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const userName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const messageBody : string = eventObj.body.originalDetectIntentRequest.payload.completeMessage.messageBody;
            const details = messageBody.split(',');
            const whenTime = details[details.length - 1];
            const reminderType = details[0];
            const channelName = eventObj.body.originalDetectIntentRequest.payload.source;
            const cache = await CacheMemory.get(sessionId);
            const patientUserId = await this.registration.getPatientUserId(channelName,
                sessionId, userName);
            let message = null;
            const getreminderurl = `reminders/search?userId=${patientUserId}&name=${cache.reminderName}&whenTime=${whenTime}&reminderType=${reminderType}`;
            const responseBody = await this.needleService.needleRequestForREAN("get", getreminderurl);
            const listOfReminders = responseBody.Data.Reminders.Items;
            if (listOfReminders.length > 0) {
                for (const reminder of listOfReminders) {
                    const apiURL = `reminders/${reminder.id}`;
                    this.needleService.needleRequestForREAN("delete", apiURL, null, null);
                }
                message = `Hi ${userName}, \nYour ${cache.reminderName} set at ${details} has been deleted`;
            }
            else {
                message = `Hi ${userName}, \nIt seems like we were not able to find this reminder to delete. If you are still getting the reminder kindly connect with our support, or simply reply with a thumbs down`;
            }
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [message] }
                    }
                ]
            };
            return data;
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Ask time reminder service error');
        }
    }

}
