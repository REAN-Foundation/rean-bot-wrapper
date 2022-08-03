/* eslint-disable max-len */
/* eslint-disable linebreak-style */
import { Imessage, Iresponse, IchatMessage } from '../refactor/interface/message.interface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { handleRequestservice } from './handle.request.service';
import { autoInjectable } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { ChatMessage } from '../models/chat.message.model';
import { SequelizeClient } from '../connection/sequelizeClient';
import { CallAnemiaModel } from './call.anemia.model';
import { GoogleTextToSpeech } from './text.to.speech';
import { UserFeedback } from '../models/user.feedback.model';
import { SlackMessageService } from "./slack.message.service";

@autoInjectable()
export class MessageFlow{

    constructor(
        private slackMessageService?: SlackMessageService,
        private handleRequestservice?: handleRequestservice,
        private sequelizeClient?: SequelizeClient,
        private callAnemiaModel?: CallAnemiaModel) {
    }

    async checkTheFlow(msg: any, channel: string, platformMessageService: platformServiceInterface){
        const messagetoDialogflow: Imessage = await platformMessageService.getMessage(msg);
        console.log("message to DF", messagetoDialogflow);
        const chatMessageObj: IchatMessage = {
            name           : messagetoDialogflow.name,
            platform       : messagetoDialogflow.platform,
            direction      : messagetoDialogflow.direction,
            messageType    : messagetoDialogflow.type,
            messageContent : messagetoDialogflow.messageBody,
            imageContent   : null,
            imageUrl       : messagetoDialogflow.imageUrl,
            userPlatformID : messagetoDialogflow.sessionId,
            intent         : null
        };
        await this.sequelizeClient.connect();
        const personrequest = new ChatMessage(chatMessageObj);
        await personrequest.save();
        const userId = chatMessageObj.userPlatformID;
        const resp = await UserFeedback.findAll({ where: { userId: userId } });
        if (resp.length === 0) {
            this.get_put_msg_Dialogflow(messagetoDialogflow, channel, platformMessageService);
        }
        else {
            const humanHandoff = resp[resp.length - 1].humanHandoff;
            const ts = resp[resp.length - 1].ts;
            if (humanHandoff === "true" ){
                this.slackMessageService.delayedInitialisation();
                const client = this.slackMessageService.client;
                const channelID = this.slackMessageService.channelID;
                await client.chat.postMessage({ channel: channelID, text: chatMessageObj.messageContent, thread_ts: ts });
                
            }
            else {
                this.get_put_msg_Dialogflow(messagetoDialogflow, channel, platformMessageService);
            }
        }
        
    }

    async get_put_msg_Dialogflow (messagetoDialogflow: Imessage, channel: string ,platformMessageService: platformServiceInterface) {
        console.log("entered the get_put_msg_Dialogflow,,,,,,,,,,,,,,,,,,,,,,,,,");
        
        return this.processMessage(messagetoDialogflow, channel ,platformMessageService);
    }

    async processMessage(messagetoDialogflow: Imessage, channel: string ,platformMessageService: platformServiceInterface) {
        if (messagetoDialogflow.messageBody === ' '){
            const message_to_platform = await platformMessageService.SendMediaMessage(messagetoDialogflow.sessionId,null,"Sorry, I did not get that. Can you say it again?",messagetoDialogflow.type);
            return message_to_platform;
        }
        const processedResponse = await this.handleRequestservice.handleUserRequest(messagetoDialogflow, channel);
        const intent = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.intent ? processedResponse.message_from_dialoglow.result.intent.displayName : '';
        const response_format: Iresponse = await platformMessageService.postResponse(messagetoDialogflow, processedResponse);
        const dfResponseObj = {
            platform       : response_format.platform,
            direction      : response_format.direction,
            messageType    : response_format.message_type,
            messageContent : response_format.messageText,
            imageContent   : response_format.messageBody,
            imageUrl       : response_format.messageImageUrl,
            userPlatformID : response_format.sessionId,
            intent         : intent
        };

        const personresponse = new ChatMessage(dfResponseObj);
        await personresponse.save();

        if (processedResponse.message_from_dialoglow.text) {
            let message_to_platform = null;

            await this.replyInAudio(messagetoDialogflow, response_format);
            if (intent === "anemiaInitialisation-followup") {
                const messageToPlatform = await this.callAnemiaModel.callAnemiaModel(processedResponse.processed_message[0]);
                platformMessageService.SendMediaMessage(messagetoDialogflow.sessionId,null,messageToPlatform,response_format.message_type);
            }
            else {
                message_to_platform = await platformMessageService.SendMediaMessage(messagetoDialogflow.sessionId, response_format.messageBody,response_format.messageText, response_format.message_type);

                // console.log("the message to platform is", message_to_platform);

                if (!processedResponse.message_from_dialoglow.text) {
                    console.log('An error occurred while sending messages!');
                }
                return message_to_platform;
            }
        }
        else {
            console.log('An error occurred while processing messages!');
        }
    }

    async replyInAudio(message: Imessage, response_format: Iresponse) {
        if (message.type === "voice") {

            // const obj = new AWSPolly();
            // const audioURL = await obj.texttoSpeech(response_format.messageText);
            const id = message.sessionId;
            const obj = new GoogleTextToSpeech();
            const audioURL = await obj.texttoSpeech(response_format.messageText, id);
            console.log("audioURL", audioURL);
            response_format.message_type = "voice";
            response_format.messageBody = audioURL;
        }
        else {
            console.log("audio reply not required");
        }
    }

    async send_manual_msg (msg,platformMessageService: platformServiceInterface) {
        const response_format = await platformMessageService.createFinalMessageFromHumanhandOver(msg);
        const person = new ChatMessage(response_format);
        await person.save();

        let message_to_platform = null;
        // eslint-disable-next-line max-len
        message_to_platform = await platformMessageService.SendMediaMessage(response_format.sessionId, response_format.messageBody,response_format.messageText, response_format.message_type);
        return message_to_platform;
    }

}
