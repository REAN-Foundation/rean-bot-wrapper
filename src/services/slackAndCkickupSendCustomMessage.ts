import { Iresponse } from "../refactor/interface/message.interface";
import { commonResponseMessageFormat } from "./common.response.format.object";
import { WhatsappMessageService } from './whatsapp.message.service';
import { WhatsappMetaMessageService } from './whatsapp.meta.message.service';
import { TelegramMessageService } from './telegram.message.service';
import { delay, inject, Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class SlackClickupCommonFunctions {

    constructor(@inject(delay(() => TelegramMessageService)) public telegramMessageservice,
                @inject(delay(() => WhatsappMetaMessageService)) public whatsappNewMessageService,
                @inject(delay(() => WhatsappMessageService)) public whatsappMessageService){}

    sendCustomMessage = async(channel, contact, message) => {
        console.log("sendCustomMessage", channel, contact, message);
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
        else if (channel === "whatsappMeta"){
            response_format.sessionId = contact.toString();
            await this.whatsappNewMessageService.SendMediaMessage(response_format,null);
        }
    };

}
