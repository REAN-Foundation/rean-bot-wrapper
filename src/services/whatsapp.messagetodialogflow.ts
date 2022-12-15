import { WhatsappRequest } from "./request.format/whatsapp.request";
import { MessageFunctionalities } from './whatsapp.meta.functionalities';
import { getRequestOptions } from '../utils/helper';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import needle from 'needle';
import { autoInjectable } from "tsyringe";

@autoInjectable()
export class WhatsappMessageToDialogflow {

    constructor (private messageFunctionalities?: MessageFunctionalities,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService,) {}

    async messageToDialogflow(requestBody: any, channel: string) {
        const whatsappRequestObj = new WhatsappRequest(requestBody);
        const generatorGetMessage = whatsappRequestObj.getMessages();
        const generatorGetContacts = whatsappRequestObj.getContacts();
        let done = false;
        while (done === false){
            const messageNextObject = generatorGetMessage.next();
            const contactsNextObject = generatorGetContacts.next();
            const messageObj = messageNextObject.value;
            const contactsObj = contactsNextObject.value;
            done = messageNextObject.done;
            let messagetoDialogflow;
            if (messageObj){
                if (messageObj.isText() === true) {
                    messagetoDialogflow = await this.messageFunctionalities.textMessageFormat(messageObj);
                }
                else if (messageObj.isReaction() === true) {
                    messagetoDialogflow = await this.messageFunctionalities.reactMessageFormat(messageObj);
                }
                else if (messageObj.isType('location') === true ) {
                    messagetoDialogflow = await this.messageFunctionalities.locationMessageFormat(messageObj);
                }
                else if (messageObj.isType('image') === true ) {
                    messagetoDialogflow = await this.messageFunctionalities.imageMessaegFormat(messageObj);
                }
                else if (messageObj.isType("interactive") === true) {
                    if (messageObj.isType("list_reply") === true ) {
                        return await this.messageFunctionalities.interactiveListMessaegFormat(messageObj);
                    } else {
                        return await this.messageFunctionalities.interactiveMessaegFormat(messageObj);
                    }
                }
                else {
                    if (channel === "whatsapp") {
                        if (messageObj.isType('voice') === true ) {
                            messagetoDialogflow = await this.messageFunctionalities.voiceMessageFormat(messageObj, 'whatsapp');
                        }
                        else {
                            throw new Error("Message is neither text, voice nor location");
                        }
                        
                    }
                    else {
                        if (messageObj.isType('audio') === true ) {
                            const mediaUrl = await this.getMetaMediaUrl(messageObj.getAudioId());
                            messageObj.setAudioUrl(mediaUrl);
                            messagetoDialogflow = await this.messageFunctionalities.voiceMessageFormat(messageObj, 'whatsappMeta');
                        }
                        else {
                            throw new Error("Message is neither text, voice nor location");
                        }
                    }
                }
            }
            else {

                //messageObj is void
            }
            if (contactsObj){
                messagetoDialogflow.platformId = contactsObj.getPlatformId();
                messagetoDialogflow.name = contactsObj.getUserName();
            }
            console.log("message to dialogflow", messagetoDialogflow);
            return messagetoDialogflow;
        }
    }

    async getMetaMediaUrl(mediaId){
        try {
            const options = getRequestOptions();
            const token = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
            options.headers['Content-Type'] = 'application/json';
            options.headers['Authorization'] = `Bearer ${token}`;
            const hostname = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_WHATSAPP_HOST");
            const path = `/v14.0/${mediaId}`;
            const apiUrl_meta = hostname + path;
            const response = await needle("get",apiUrl_meta, options);
            return response.body.url;
        }
        catch (error) {
            console.log("error", error);
        }
    }

}