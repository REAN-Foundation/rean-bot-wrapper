import { Iresponse } from "../refactor/interface/message.interface";
import { commonResponseMessageFormat } from "./common.response.format.object";
import { WhatsappMessageService } from './whatsapp.message.service';
import { WhatsappMetaMessageService } from './whatsapp.meta.message.service';
import { TelegramMessageService } from './telegram.message.service';
import { autoInjectable, singleton } from "tsyringe";

@autoInjectable()
@singleton()
export class SlackClickupCommonFunctions {

    constructor(private whatsappMessageService?: WhatsappMessageService,
        private whatsappNewMessageService?: WhatsappMetaMessageService,
        private telegramMessageservice?: TelegramMessageService){}

    sendCustomMessage = async(channel, contact, message) => {
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.platform = channel;
        response_format.sessionId = contact;
        response_format.messageText = message;
        response_format.message_type = "text";
        if (channel === "telegram"){
            await this.telegramMessageservice.SendMediaMessage(response_format,null);
        }
        else if (channel === "whatsapp"){
            response_format.sessionId = contact.toString();
            await this.whatsappMessageService.SendMediaMessage(response_format,null);
        }
        else if (channel === "whatsappNew"){
            response_format.sessionId = contact.toString();
            await this.whatsappNewMessageService.SendMediaMessage(response_format,null);
        }
    }

}
