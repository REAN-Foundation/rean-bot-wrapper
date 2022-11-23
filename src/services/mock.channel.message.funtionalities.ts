/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import { Imessage } from '../refactor/interface/message.interface';
import { autoInjectable } from "tsyringe";
import { EmojiFilter } from './filter.message.for.emoji.service';

@autoInjectable()
export class MockCHannelMessageFunctionalities implements getMessageFunctionalities {

    constructor(private emojiFilter?: EmojiFilter){}

    locationMessageFormat(msg: any) {
        throw new Error("Method not implemented.");
    }

    voiceMessageFormat(msg: any) {
        throw new Error("Method not implemented.");
    }

    async textMessageFormat (msg) {
        const emojifilteredMessage = await this.emojiFilter.checkForEmoji(msg.messages[0].text.body);
        const returnmessage = this.inputMessageFormat(msg);
        returnmessage.messageBody = emojifilteredMessage;
        return returnmessage;
    }

    inputMessageFormat (message){
        const response_message: Imessage = {
            name                      : message.contacts[0].profile.name,
            platform                  : "MockChannel",
            chat_message_id           : message.messages[0].id,
            direction                 : "In",
            messageBody               : null,
            imageUrl                  : null,
            sessionId                 : message.contacts[0].wa_id,
            replyPath                 : null,
            latlong                   : null,
            type                      : "text",
            intent                    : null,
            whatsappResponseMessageId : null,
            contextId                 : null,
            telegramResponseMessageId : null
        };
        return response_message;
    }

}
