import { DialogflowResponseService } from './dialogflow-response.service';
import { translateService } from './translate'
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class handleRequestservice{

    constructor(private DialogflowResponseService?: DialogflowResponseService,
                private translateService?: translateService ) {
                }

    async handleUserRequest (handlerequest) {
        console.log("the hndle request is ", handlerequest)
        
        let message_from_dialoglow:any;
        let processed_message: any;
        let translate_message: any;
        let telegram_id = handlerequest.message.sessionId;

        // this.TelegramStatistics.saveRequestStatistics(message, message.text);

        //get the translated message
        translate_message = await this.translateService.translateMessage(handlerequest.message.messageBody)

        message_from_dialoglow = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, telegram_id);

        // process the message from dialogflow before sending it to whatsapp
        processed_message = await this.translateService.processdialogflowmessage(message_from_dialoglow)

        return {processed_message, message_from_dialoglow}  
    }
}