import { message } from '../refactor/interface/message.interface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { handleRequestservice } from './handle.request.service';
import { autoInjectable } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { elasticsearchUserstat } from './statistics/user.stat.service';

@autoInjectable()
export class MessageFlow{

    constructor(
        private handleRequestservice?: handleRequestservice,
        private _elasticsearchUserstat?: elasticsearchUserstat) {
    }

    async get_put_msg_Dialogflow (msg, client ,platformMessageService: platformServiceInterface) {
        console.log("entered the get_put_msg_Dialogflow,,,,,,,,,,,,,,,,,,,,,,,,,");
        const messagetoDialogflow: message = await platformMessageService.getMessage(msg);
        this._elasticsearchUserstat.createUserStat(messagetoDialogflow);

        const response = await this.handleRequestservice.handleUserRequest(messagetoDialogflow, client);

        const response_format = await platformMessageService.postResponse(messagetoDialogflow, response);
        this._elasticsearchUserstat.createUserStat(response_format);

        if (response.text_part_from_DF) {
            let message_to_platform = null;
            // eslint-disable-next-line max-len
            message_to_platform = await platformMessageService.SendMediaMessage(messagetoDialogflow.sessionId, response_format.messageBody,response_format.messageText);
            console.log("the message to platform is", message_to_platform);
            if (!response.text_part_from_DF) {
                console.log('An error occurred while sending messages!');
            }
            return message_to_platform;
        }
        else {
            console.log('An error occurred while processing messages!');
        }
    }

    async send_manual_msg (msg,platformMessageService: platformServiceInterface) {
        const response_format = await platformMessageService.createFinalMessageFromHumanhandOver(msg);
        this._elasticsearchUserstat.createUserStat(response_format);

        let message_to_platform = null;
        // eslint-disable-next-line max-len
        message_to_platform = await platformMessageService.SendMediaMessage(response_format.sessionId, response_format.messageBody,response_format.messageText);
        
        return message_to_platform;
    }

}
