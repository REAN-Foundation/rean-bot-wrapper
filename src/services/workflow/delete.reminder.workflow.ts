import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { sendApiInteractiveListService } from '../whatsappmeta.button.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { sendTelegramButtonService } from '../telegram.button.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { CacheMemory } from '../cache.memory.service';
import { Registration } from '../registration/patient.registration.service';
import { NeedleService } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { BaseWorkflow } from '../../services/workflow/base.workflow'
import { Loader } from '../../startup/loader';

@scoped(Lifecycle.ContainerScoped)
export class DeleteRemindersWorkflow extends BaseWorkflow {
    
    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(Registration) private registration?: Registration
    ) {
        super();
    }

    async initiateDelete (eventObj) {
        try {
            eventObj.container = Loader.container;
            const sessionId : string = eventObj.platformId;
            const userName : string = eventObj.name;
            let messageType = "";
            let payload = null;
            let channelName = eventObj.platform;
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
                    if (channelName === 'whatsappMeta') {
                        uniqueReminderTypeButtonArrays.push(reminderTypeButtonArray[i]);
                        uniqueReminderTypeButtonArrays.push("Reminder " + String(i + 1));
                        uniqueReminderTypeButtonArrays.push("delete_reminder_type" + String(i));
                    }
                    else {
                        uniqueReminderTypeButtonArrays.push(reminderTypeButtonArray[i]);
                        uniqueReminderTypeButtonArrays.push("delete_reminder_type" + String(i));
                    }
                }
                if (channelName === 'whatsappMeta') {
                    payload = await sendApiInteractiveListService(uniqueReminderTypeButtonArrays,true);
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
                const sendMessage = await this._platformMessageService.SendMediaMessage(response_format, payload);
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
            eventObj.container = Loader.container;
            const sessionId : string = eventObj.platformId;
            const userName : string = eventObj.name;
            const messageBody : string = eventObj.messageBody;
            const messageBodyList = messageBody.split(',');
            let messageType = "";
            let payload = null;
            let channelName = eventObj.platform;
            const patientUserId = await this.registration.getPatientUserId(channelName,
                sessionId, userName);
            let message = null;
            const getreminderurl = `reminders/search?userId=${patientUserId}&name=${messageBodyList[0]}`;
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
                CacheMemory.set(sessionId,{ reminderName: messageBodyList[0] });
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
                response_format.messageText = `select the ${messageBodyList[0]} you want to delete`;
                response_format.message_type = messageType;
                await this._platformMessageService.SendMediaMessage(response_format, payload);
            } else {
                message = `Hi ${userName}, \nIt seems like you don't have any ${messageBodyList[0]} set at the moment`;
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
            eventObj.container = Loader.container;
            const sessionId : string = eventObj.platformId;
            const userName : string = eventObj.name;
            const messageBody : string = eventObj.messageBody;
            const details = messageBody.split(',');
            const whenTime = details[details.length - 1];
            const reminderType = details[0];
            const channelName = eventObj.platform;
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

    //Initializing state in CacheMemory
    // async startWorkflow(workflowName:string, userId: string, steps: string[]): Promise<void> {
    //     const initialState = { currentStep: steps[0], currentIndex:0, workflow: {name: workflowName, sequence: steps}, isComplete: false };
    //     await CacheMemory.set(userId, initialState);
    // }

    // Move to the next step and update the workflow state
    // async next(eventObj: any): Promise<string> {
    //     const userId = eventObj.platformId;
    //     const state = await CacheMemory.get(userId);
    //     if (!state || state.isComplete) {
    //         throw new Error("Workflow has completed or no state found.");
    //     }

    //     const currentStep = state.currentStep;
    //     const result = await this.executeStep(currentStep, eventObj);

    //     // Update workflow state in cache
    //     state.currentIndex += 1;
    //     if (state.currentIndex >= state.workflow.sequence.length) {
    //         state.isComplete = true;
    //         await CacheMemory.clear(); // Optionally clear cache after completion
    //     } else {
    //         state.currentStep = state.workflow.sequence[state.currentIndex];
    //     }

    //     await CacheMemory.update(userId, state); // Update state in cache
    //     return result;
    // }

    async executeStep(step: string, eventObj: any): Promise<string> {
        // Execute the corresponding workflow
        if (step === 'initiateDelete'){
            await this.initiateDelete(eventObj)
            return "Getting your reminders";
        }
        if (step === 'getReminderDetails') {
            await this.getReminderDetails(eventObj)
            return "getReminderDetails executed."};
        if (step === 'deleteRemider') {
            await this.deleteRemider(eventObj)
            return "Workflow completed.";
        }
        return "Unknown step.";
    }
}