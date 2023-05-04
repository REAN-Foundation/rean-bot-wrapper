/* eslint-disable init-declarations */
import { ChatMessage } from "../models/chat.message.model";
import { Iresponse } from "../refactor/interface/message.interface";
import needle from 'needle';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from "tsyringe";
import { EntityManagerProvider } from "./entity.manager.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class TelegramPostResponseFunctionalities {

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?:ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?:EntityManagerProvider
    ){}

    sendtextResponse = async(response_format:Iresponse,telegram) => {
        let responseId = 0;
        let telegramReswponseData;
        const message = this.sanitizeMessage(response_format.messageText);
        telegram.sendMessage(response_format.sessionId, message, { parse_mode: 'HTML' }).then(async function (data) {
            responseId = data.message_id;
            telegramReswponseData = data;
        });
        await this.updateResponseMessageId(responseId,response_format.sessionId);
        return telegramReswponseData;
    };
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendvoiceResponse = async(response_format:Iresponse,telegram) => {
        let telegramReswponseData;
        var data = {
            chat_id : response_format.sessionId,
            voice   : response_format.messageBody
        };
        const botToken = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN");
        const channelUrl = `https://api.telegram.org/bot${botToken}/sendVoice`;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        needle.post(channelUrl, data, function(err, resp, body) {
            if (err) {
                console.log("error", err);
            }
            else {
                telegramReswponseData = data;
            }
        });
        return telegramReswponseData;
    };

    sendimageResponse = (response_format:Iresponse,telegram) => {
        let telegramReswponseData;
        const message = this.sanitizeMessage(response_format.messageText);
        telegram.sendPhoto(response_format.sessionId,response_format.messageBody,{ caption: message })
            .then(function (data) {
                telegramReswponseData = data;
            });
        return telegramReswponseData;
    };

    updateResponseMessageId = async(responseId, userPlatformID) => {
        const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
        // eslint-disable-next-line max-len
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService,clientName)).getRepository(ChatMessage);
        const respChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: userPlatformID } });
        const id = respChatMessage[respChatMessage.length - 1].id;
        await chatMessageRepository.update({ telegramResponseMessageId: responseId }, { where: { id: id } } )
            .then(() => { console.log("updated telegram respomse id"); })
            .catch(error => console.log("error on update", error));
    };

    sanitizeMessage = (message) => {
        if (message > 4096) {
            var strshortened = message.slice(0, 3800);
            strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
            strshortened = strshortened.replace(/(<\/ b>|<\/b>)/mgi, "</b>");
            message = strshortened + '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.';
        }
        return message;
    };

}
