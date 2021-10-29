import { DialogflowResponseService } from './dialogflow.response.service';
import { translateService } from './translate.service'
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class handleRequestservice{

    constructor(private DialogflowResponseService?: DialogflowResponseService,
                private translateService?: translateService ) {
                }

    async handleUserRequest (message, client) {        
        let message_from_dialoglow:any;
        let processed_message: any;
        let translate_message: any;
        let platform_id = message.sessionId;

        //get the translated message
        translate_message = await this.translateService.translateMessage(message.messageBody)

        message_from_dialoglow = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, platform_id, client);
        let text_part_from_DF = message_from_dialoglow.text;

        // process the message from dialogflow before sending it to whatsapp
        processed_message = await this.translateService.processdialogflowmessage(text_part_from_DF, translate_message.detected_language)

        return {processed_message, text_part_from_DF}  
    }
}