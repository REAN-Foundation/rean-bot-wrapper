/* eslint-disable @typescript-eslint/no-unused-vars */
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

    sendtextResponse = async(response_format:Iresponse, telegram, payload) => {
        let responseId = 0;
        let telegramResponseData;
        const message = this.sanitizeMessage(response_format.messageText);
        await telegram.sendMessage(
            response_format.sessionId,
            message,
            {
                parse_mode : 'HTML'
            }).then(async function (data) {
            responseId = data.message_id;
            telegramResponseData = data;
        });
        await this.updateResponseMessageId(responseId,response_format.sessionId);
        return telegramResponseData;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendvoiceResponse = async(response_format:Iresponse,telegram,payload) => {
        let responseData;
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
                responseData = data;
            }
        });
        return responseData;
    };

    sendimageResponse = (response_format:Iresponse,telegram, payload) => {
        let telegramResponseData;
        const message = this.sanitizeMessage(response_format.messageText);
        telegram.sendPhoto(response_format.sessionId,response_format.messageBody,{ caption: message })
            .then(function (data) {
                telegramResponseData = data;
            });
        return telegramResponseData;
    };

    sendlocationResponse = async (response_format:Iresponse, telegram, payload) => {
        let responseId = 0;
        const latitude = response_format.location?.latitude;
        const longitude = response_format.location?.longitude;
        if (latitude && longitude) {
            const responseData = await telegram.sendLocation(
                response_format.sessionId,
                latitude,
                longitude
            );
            responseId = responseData?.message_id;
            await this.updateResponseMessageId(responseId, response_format.sessionId);
            return responseData;
        }
        return null;
    };

    updateResponseMessageId = async(responseId, userPlatformID) => {
        // eslint-disable-next-line max-len
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const respChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: userPlatformID } });
        if (respChatMessage.length > 0 )
        {
            const id = respChatMessage[respChatMessage.length - 1].id;
            await chatMessageRepository.update({ responseMessageID: responseId }, { where: { id: id } } )
                .then(() => { console.log("updated telegram respomse id"); })
                .catch(error => console.log("error on update", error));
        }
    };

    sanitizeMessage = (message) => {
        if (message > 4096) {
            var strshortened = message.slice(0, 3800);
            strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
            strshortened = strshortened.replace(/(<\/ b>|<\/b>)/mgi, "</b>");
            var str = `\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -
            // to view more appointments.
            // \n or \n Enter additional details to filter the results.`;
            message = strshortened + str;
        }
        return message;
    };

    sendinline_keyboardResponse = async (
        response_format: Iresponse,
        telegram,
        payload
    ) => {
        let responseId = 0;
        const message = response_format.messageText;

        const listOfButtonsFromPayload = payload.fields.buttons.listValue.values;

        // Horizontal (all in one row) layout
        const listOfButtons = [[]];
        for (const ele of listOfButtonsFromPayload) {
            const replyFields = ele.structValue.fields.reply.structValue.fields;

            const tempButton = {
                text: replyFields.title.stringValue,
                callback_data: replyFields.id.stringValue
            };

            listOfButtons[0].push(tempButton); // push into first row
        }

        // Vertical layout: each button on a new row
        const listOfVerticalKeyboard = [];
        for (const ele of listOfButtonsFromPayload) {
            const replyFields = ele.structValue.fields.reply.structValue.fields;

            const tempButton = {
                text: replyFields.title.stringValue,
                callback_data: replyFields.id.stringValue
            };

            listOfVerticalKeyboard.push([tempButton]); // wrap in array to make a row
        }

        // Default to horizontal unless "typeOfButton" is "vertical"
        const keyboard = {
            inline_keyboard: (payload["typeOfButton"] === "vertical")
                ? listOfVerticalKeyboard
                : listOfButtons
        };

        console.log('Keyboard prepared:', keyboard);

        const opts = {
            reply_markup: JSON.stringify(keyboard)
        };

        const responseData = await telegram.sendMessage(
            response_format.sessionId,
            message,
            opts
        );
        responseId = responseData?.message_id;
        await this.updateResponseMessageId(responseId, response_format.sessionId);

        return responseData;
    };

}
