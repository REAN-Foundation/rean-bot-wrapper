import { ReplyTelegramMessage } from '../../services/TelegramMessage.Service';
import { DialogflowResponseService } from '../../services/dialogflow-response.service';
import { translateService } from '../../services/translate'
import { autoInjectable } from 'tsyringe';
import { handlerequest, message } from '../../../src/Refactor/interface/interface';
import { handleRequestservice } from '../../services/HandleRequest'

@autoInjectable()
export class TelegramController {

    constructor(private replyTelegramMessage?: ReplyTelegramMessage,
        private translateService?: translateService,
        private handleRequestservice?: handleRequestservice,
        private DialogflowResponseService?: DialogflowResponseService) {
    }

    async get_put_msg_Dialogflow (botObj, msg) {
        let messagetoDialogflow: message = await this.replyTelegramMessage.getMessage(msg);
        let returninterface: handlerequest = {botObject:botObj, message:messagetoDialogflow};
        this.handleRequestservice.handleUserRequest(returninterface);
        let process_raw_dialogflow = await this.handleRequestservice.handleUserRequest(returninterface)

        let response_format = await this.replyTelegramMessage.giveResponse(returninterface.message, process_raw_dialogflow.processed_message);
        if (process_raw_dialogflow.message_from_dialoglow) {
            let message_to_platform = null;
            message_to_platform = await this.replyTelegramMessage.SendTelegramMediaMessage(returninterface.botObject, returninterface.message.sessionId, response_format.messageBody,response_format.messageText)       
            if (!process_raw_dialogflow.message_from_dialoglow) {
                console.log('An error occurred while sending messages!');
            }
        }
        else {
            console.log('An error occurred while processing messages!');
        }
    }

    // async handleUserRequest (handlerequest) {
    //     console.log("the hndle request is ", handlerequest)
        
    //     let message_from_dialoglow:any;
    //     let processed_message: any;
    //     let translate_message: any;
    //     let telegram_id = handlerequest.message.sessionId;

    //     // this.TelegramStatistics.saveRequestStatistics(message, message.text);

    //     //get the translated message
    //     translate_message = await this.translateService.translateMessage(handlerequest.message.messageBody)

    //     message_from_dialoglow = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, telegram_id);

    //     // process the message from dialogflow before sending it to whatsapp
    //     processed_message = await this.translateService.processdialogflowmessage(message_from_dialoglow)

    //     return {processed_message, message_from_dialoglow}  
    // }
}