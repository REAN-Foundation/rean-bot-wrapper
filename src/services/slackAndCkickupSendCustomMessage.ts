/* eslint-disable max-len */
import { Iresponse } from "../refactor/interface/message.interface";
import { commonResponseMessageFormat } from "./common.response.format.object";
import { WhatsappMessageService } from './whatsapp.message.service';
import { WhatsappMetaMessageService } from './whatsapp.meta.message.service';
import { TelegramMessageService } from './telegram.message.service';
import { delay, inject, Lifecycle, scoped } from "tsyringe";
import { ChatMessage } from "../models/chat.message.model";
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatSession } from "../models/chat.session";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class SlackClickupCommonFunctions {

    constructor(@inject(delay(() => TelegramMessageService)) public telegramMessageservice,
                @inject(delay(() => WhatsappMetaMessageService)) public whatsappNewMessageService,
                @inject(delay(() => WhatsappMessageService)) public whatsappMessageService,
                @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
                @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    sendCustomMessage = async(channel, contact, message) => {
        console.log("sendCustomMessage", channel, contact, message);
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.platform = channel;
        response_format.sessionId = contact;
        response_format.messageText = message;
        response_format.message_type = "text";
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
        const chatSessionModel = await chatSessionRepository.findOne({ where: { userPlatformID: response_format.sessionId } });
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        await chatMessageRepository.create({
            chatSessionID  : chatSessionModel.autoIncrementalID,
            platform       : channel,
            direction      : "Out",
            messageType    : "text",
            messageContent : message,
            userPlatformID : contact
        });
        if (channel === "Telegram" || channel === "telegram"){
            await this.telegramMessageservice.SendMediaMessage(response_format,null);
        }
        else if (channel === "whatsapp" ){
            response_format.sessionId = contact.toString();
            await this.whatsappMessageService.SendMediaMessage(response_format,null);
        }
        else if (channel === "whatsappMeta" || channel === "WhatsappMeta"){
            response_format.sessionId = contact.toString();
            await this.whatsappNewMessageService.SendMediaMessage(response_format,null);
        }
    };

    // Sends an approved WhatsApp template (no body variables, "en") purely to re-open the
    // 24-hour customer service window. Only WhatsApp channels support templates.
    sendTemplateMessage = async(channel, contact, templateName) => {
        console.log("sendTemplateMessage", channel, contact, templateName);
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.platform = channel;
        response_format.sessionId = contact.toString();
        response_format.messageText = templateName;
        response_format.message_type = "template";
        const payload = {
            templateName       : templateName,
            languageForSession : "en",
            variables          : []
        };
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
        const chatSessionModel = await chatSessionRepository.findOne({ where: { userPlatformID: response_format.sessionId } });
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        await chatMessageRepository.create({
            chatSessionID  : chatSessionModel ? chatSessionModel.autoIncrementalID : null,
            platform       : channel,
            direction      : "Out",
            messageType    : "template",
            messageContent : templateName,
            userPlatformID : contact
        });
        if (channel === "whatsapp"){
            await this.whatsappMessageService.SendMediaMessage(response_format, payload);
        }
        else if (channel === "whatsappMeta" || channel === "WhatsappMeta"){
            await this.whatsappNewMessageService.SendMediaMessage(response_format, payload);
        }
        else {
            console.log("Template send skipped, channel does not support templates:", channel);
        }
    };

}
