import { message } from '../refactor/interface/message.interface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { handleRequestservice } from './handle.request.service';
import { autoInjectable } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { response } from '../refactor/interface/message.interface';
import { FeedbackService } from '../services/feedback/feedback.service';
import { UserRequest } from '../models/user.request.model';
import { UserResponse } from '../models/user.response.model';
import { SequelizeClient } from '../connection/sequelizeClient';

@autoInjectable()
export class MessageFlow{

    constructor(
        private handleRequestservice?: handleRequestservice,
        private sequelizeClient?: SequelizeClient,
        private _feedbackService?:FeedbackService) {
    }

    async get_put_msg_Dialogflow (msg, channel ,platformMessageService: platformServiceInterface) {
        console.log("entered the get_put_msg_Dialogflow,,,,,,,,,,,,,,,,,,,,,,,,,");
        const messagetoDialogflow: message = await platformMessageService.getMessage(msg);
        await this.sequelizeClient.connect();
        const personrequest = new UserRequest(messagetoDialogflow);
        await personrequest.save();
        return this.processMessage(messagetoDialogflow, channel ,platformMessageService);
    }

    async processMessage(messagetoDialogflow, channel ,platformMessageService: platformServiceInterface) {
        if (messagetoDialogflow.messageBody === ' '){
            const message_to_platform = await platformMessageService.SendMediaMessage(messagetoDialogflow.sessionId,null,"Sorry, I did not get that. Can you say it again?");
            return message_to_platform;
        }
        const processedResponse = await this.handleRequestservice.handleUserRequest(messagetoDialogflow, channel);
        // eslint-disable-next-line max-len
        const response_format: response = await platformMessageService.postResponse(messagetoDialogflow, processedResponse);

        const personresponse = new UserResponse(response_format);
        await personresponse.save();

        if (processedResponse.message_from_dialoglow.text) {
            let message_to_platform = null;

            const intent = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.intent ? processedResponse.message_from_dialoglow.result.intent.displayName : '';
            // eslint-disable-next-line max-len
            message_to_platform = this._feedbackService.checkIntentAndSendFeedback(intent,messagetoDialogflow,channel, platformMessageService);
            // eslint-disable-next-line max-len
            message_to_platform = await platformMessageService.SendMediaMessage(messagetoDialogflow.sessionId, response_format.messageBody,response_format.messageText);

            // console.log("the message to platform is", message_to_platform);

            if (!processedResponse.message_from_dialoglow.text) {
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
        const person = new UserRequest(response_format);
        await person.save();

        let message_to_platform = null;
        // eslint-disable-next-line max-len
        message_to_platform = await platformMessageService.SendMediaMessage(response_format.sessionId, response_format.messageBody,response_format.messageText);
        return message_to_platform;
    }

}
