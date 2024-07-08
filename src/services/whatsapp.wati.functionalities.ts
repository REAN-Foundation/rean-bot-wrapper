/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { getMessageFunctionalities  } from "../refactor/interface/message.service.functionalities.interface";
import { Imessage } from '../refactor/interface/message.interface';
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { Speechtotext } from "./speech.to.text.service";
import { inject, Lifecycle, scoped } from 'tsyringe';
import { EmojiFilter } from "./filter.message.for.emoji.service";
import { AwsS3manager } from "./aws.file.upload.service";
import { UserLanguage } from "./set.language";
import needle from 'needle';
import { Message } from "./request.format/whatsapp.wati.message.format";
import { getRequestOptions } from "../utils/helper";
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatMessage } from "../models/chat.message.model";
import axios, {AxiosRequestConfig} from 'axios';
import fs from 'fs';
import FormData from 'form-data';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('follow-redirects').https;

@scoped(Lifecycle.ContainerScoped)
export class WatiMessageFunctionalities implements getMessageFunctionalities {

    constructor(@inject(EmojiFilter) private emojiFilter?: EmojiFilter,
        @inject(Speechtotext ) private speechtotext?: Speechtotext,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
        @inject(UserLanguage) private userLanguage?: UserLanguage,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async textMessageFormat (messageObj: Message) {
        const messageToDialogflow = this.inputMessageFormat(messageObj);
        const text = messageObj.getText();
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(text);
        messageToDialogflow.messageBody = text;
        if (emojiFilteredMessage === "NegativeFeedback"){
            messageToDialogflow.intent = "NegativeFeedback";
        }
        return messageToDialogflow;
    }

    async reactionMessageFormat (messageObj: Message) {

        // Method not implemented yet
    }

    async locationMessageFormat(messageObj: Message) {
        
        // Method not implemented yet
    }

    async voiceMessageFormat(messageObj: Message) {

        const mediaUrl = messageObj.getMediaPath();
        const filePath = await this.getWatiMedia('audio', mediaUrl, '.ogg');
        return await this.commonVoiceAudiFormat(messageObj, filePath);
    }

    async audioMessageFormat(messageObj: Message) {

        const mediaUrl = messageObj.getMediaPath();
        const filePath = await this.getWatiMedia('audio', mediaUrl, '.ogg');
        return await this.commonVoiceAudiFormat(messageObj, filePath);
    }

    async imageMessageFormat(messageObj: Message) {
        const mediaUrl = messageObj.getMediaPath();
        const filePath = await this.getWatiMedia('image', mediaUrl, '.jpg');
        const location = await this.awsS3manager.uploadFile(filePath);


        const messageToDialogflow = this.inputMessageFormat(messageObj);
        const text = messageObj.getText();
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(text);
        messageToDialogflow.messageBody = text;
        if (emojiFilteredMessage === "NegativeFeedback"){
            messageToDialogflow.intent = "NegativeFeedback";
        }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const url = require('url');
        const urlParse = url.parse(location);
        const imageUrl = (urlParse.protocol + urlParse.hostname + urlParse.pathname);
        messageToDialogflow.type = 'image';
        messageToDialogflow.imageUrl = location;
        messageToDialogflow.messageBody = imageUrl;
        return messageToDialogflow;
    }

    async interactiveMessageFormat(messageObj: Message) {

        // Method not implemented yet
    }

    async list_replyMessageFormat(messageObj: Message) {

        // Method not implemented yet
    }

    async button_replyMessageFormat(messageObj: Message) {
        const message = messageObj.getinteractivebutton().title;
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const contextId = messageObj.getContextId();
        messagetoDialogflow.messageBody = message;

        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const contextMessage = await chatMessageRepository.findOne({ where: { responseMessageID: contextId } });
        const buttonContext = JSON.parse(contextMessage.dataValues.imageContent);
        const intent = buttonContext.find(o => o.text === message);
        messagetoDialogflow.intent = intent.id;
        return messagetoDialogflow;
    }

    async buttonMessageFormat(messageObj: Message) {
        const message = messageObj.getButton().title;
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const contextId = messageObj.getContextId();
        messagetoDialogflow.messageBody = message;

        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const contextMessage = await chatMessageRepository.findOne({ where: { responseMessageID: contextId } });
        const buttonContext = JSON.parse(contextMessage.dataValues.imageContent);
        const intent = buttonContext.find(o => o.text === message);
        messagetoDialogflow.intent = intent.id.parameters[0].payload;
        return messagetoDialogflow;
    }

    inputMessageFormat(messageObj) {
        const messagetoDialogflow: Imessage = {
            name              : null,
            platform          : messageObj.getChannel(),
            chat_message_id   : messageObj.getChatId(),
            direction         : "In",
            messageBody       : null,
            imageUrl          : null,
            platformId        : messageObj.getUserId(),
            replyPath         : null,
            latlong           : null,
            type              : "text",
            intent            : null,
            responseMessageID : null,
            contextId         : messageObj.getContextId()
        };
        return messagetoDialogflow;
    }

    getWatiMedia = async (type, mediaPath, extension) => {
        const watiToken = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WATI_TOKEN");
        const baseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WATI_BASE_URL");
        const fileName = `${type}/` + Date.now() + `${extension}`;
        const writer = fs.createWriteStream(fileName);
        const data = new FormData();
        data.append('fileName', mediaPath);
        const options: AxiosRequestConfig = {
            method        : "GET",
            maxBodyLength : Infinity,
            url           : `${baseUrl}/api/v1/getMedia`,
            headers       : {
                Authorization : `${watiToken}`,
                ...data.getHeaders()
            },
            data         : data,
            responseType : 'stream',
        };
        const response = await axios.request(options);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                resolve(fileName);
            });
        });
    }

    async commonVoiceAudiFormat(messageObj, mediaUrl) {
        const userId = messageObj.getUserId();
        const preferredLanguage = await this.userLanguage.getPreferredLanguageofSession(userId);
        const convertedToText = await this.speechtotext.SendSpeechRequest(mediaUrl, "whatsapp", preferredLanguage);
        if (preferredLanguage !== 'null') {
            if (convertedToText) {
                const messagetoDialogflow = this.inputMessageFormat(messageObj);
                messagetoDialogflow.messageBody = String(convertedToText);
                messagetoDialogflow.type = 'voice';
                return messagetoDialogflow;
            } else {
                const messageToDialogflow = this.inputMessageFormat(messageObj);
                messageToDialogflow.messageBody = " ";
                messageToDialogflow.type = 'text';
                return messageToDialogflow;
            }
        } else {
            const messageToDialogflow = this.inputMessageFormat(messageObj);
            messageToDialogflow.messageBody = "Need to set language";
            messageToDialogflow.type = 'text';
            return messageToDialogflow;
        }
    }
    
}
