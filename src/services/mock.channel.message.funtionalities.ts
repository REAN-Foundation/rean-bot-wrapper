/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import { Imessage } from '../refactor/interface/message.interface';
import { autoInjectable } from "tsyringe";
import { EmojiFilter } from './filter.message.for.emoji.service';
import { Message } from './request.format/whatsapp.message.format';

@autoInjectable()
export class MockCHannelMessageFunctionalities implements getMessageFunctionalities {

    constructor(private emojiFilter?: EmojiFilter){}

    locationMessageFormat(msg: any) {
        throw new Error("Method not implemented.");
    }

    voiceMessageFormat(msg: any) {
        throw new Error("Method not implemented.");
    }

    async textMessageFormat (messageObj: Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const text = messageObj.getText();
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(text);
        messagetoDialogflow.messageBody = text;
        if (emojiFilteredMessage === "NegativeFeedback"){
            messagetoDialogflow.intent = "NegativeFeedback";
        }
        messagetoDialogflow.contextId = messageObj.getContextId();
        return messagetoDialogflow;
    }

    inputMessageFormat (messageObj){
        const messagetoDialogflow: Imessage = {
            name                      : null,
            platform                  : "Whatsapp",
            chat_message_id           : null,
            direction                 : "In",
            messageBody               : null,
            imageUrl                  : null,
            platformId                : null,
            replyPath                 : null,
            latlong                   : null,
            type                      : "text",
            intent                    : null,
            whatsappResponseMessageId : null,
            contextId                 : null,
            telegramResponseMessageId : null
        };
        messagetoDialogflow.chat_message_id = messageObj.getChatId();
        return messagetoDialogflow;
    }

}
