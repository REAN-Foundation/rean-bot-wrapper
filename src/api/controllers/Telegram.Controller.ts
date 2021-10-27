import { platformMessageService } from '../../services/TelegramMessage.Service';
import { DialogflowResponseService } from '../../services/dialogflow-response.service';
import { translateService } from '../../services/translate'
import { autoInjectable } from 'tsyringe';
import { message } from '../../../src/Refactor/interface/interface';
import { handleRequestservice } from '../../services/HandleRequest';
// import { MessageFlow } from '../../services/GetPutMessageFLow';


@autoInjectable()
export class TelegramController {

    // constructor(private platformMessageService?: platformMessageService,
    //     private handleRequestservice?: handleRequestservice){
    //     // private MessageFlow?: MessageFlow) {
    // }


    // async get_put_msg_Dialogflow (botObj, msg) {
    //     console.log("the botoj is",botObj )
    //     let messagetoDialogflow: message = await this.platformMessageService.getMessage(msg);
    //     let process_raw_dialogflow = await this.handleRequestservice.handleUserRequest(messagetoDialogflow)

    //     let response_format = await this.platformMessageService.postResponse(messagetoDialogflow, process_raw_dialogflow.processed_message);
    //     if (process_raw_dialogflow.message_from_dialoglow) {
    //         let message_to_platform = null;
    //         message_to_platform = await this.platformMessageService.SendMediaMessage(botObj, messagetoDialogflow.sessionId, response_format.messageBody,response_format.messageText)       
    //         if (!process_raw_dialogflow.message_from_dialoglow) {
    //             console.log('An error occurred while sending messages!');
    //         }
    //     }
    //     else {
    //         console.log('An error occurred while processing messages!');
    //     }
    // }

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