/* eslint-disable max-len */
import { getMessageFunctionalities  } from "../refactor/interface/message.service.functionalities.interface";
import http from 'https';
import fs from 'fs';
import { Imessage } from '../refactor/interface/message.interface';
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { Speechtotext } from "./speech.to.text.service";
import { inject, Lifecycle, scoped} from 'tsyringe';
import { EmojiFilter } from "./filter.message.for.emoji.service";
import { AwsS3manager } from "./aws.file.upload.service";
import { UserLanguage } from "./set.language";
import needle from 'needle';
import { Message } from "./request.format/whatsapp.wati.message.format";
import { getRequestOptions } from "../utils/helper";
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatMessage } from "../models/chat.message.model";

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
        // Method not implemented yet
    }

    async audioMessageFormat(messageObj: Message) {
        // Method not implemented yet
    }

    async imageMessageFormat(messageObj: Message) {
        // Method not implemented yet
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
        // Method not implemented yet
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
}