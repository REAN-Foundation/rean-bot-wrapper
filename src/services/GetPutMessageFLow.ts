import { message } from '../Refactor/interface/interface';
// import { platformMessageService } from './TelegramMessage.Service';
import { handleRequestservice } from './HandleRequest';
import { autoInjectable } from 'tsyringe';
import { platformServiceInterface } from '../Refactor/interface/PlatformInterface';

@autoInjectable()
export class MessageFlow{

    constructor(
        private handleRequestservice?: handleRequestservice) {
    }

    async get_put_msg_Dialogflow (msg, client ,platformMessageService: platformServiceInterface) {
        console.log("entered the get_put_msg_Dialogflow,,,,,,,,,,,,,,,,,,,,,,,,,")
        let messagetoDialogflow: message = await platformMessageService.getMessage(msg);
        let response = await this.handleRequestservice.handleUserRequest(messagetoDialogflow, client)

        let response_format = await platformMessageService.postResponse(messagetoDialogflow, response);
        if (response.text_part_from_DF) {
            let message_to_platform = null;
            message_to_platform = await platformMessageService.SendMediaMessage(messagetoDialogflow.sessionId, response_format.messageBody,response_format.messageText)
            console.log("the message to platform is", message_to_platform)      
            if (!response.text_part_from_DF) {
                console.log('An error occurred while sending messages!');
                // if (client== "REAN_SUPPORT") {
                //     ResponseHandler.sendFailureResponse(res, 200, 'An error occurred while processing messages!', req);
                // }
            }
            return message_to_platform;
        }
        else {
            console.log('An error occurred while processing messages!');
        }
    }
}