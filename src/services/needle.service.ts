
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import needle from "needle";
import { GetHeaders } from './biometrics/get.headers';
import { getRequestOptions } from '../utils/helper';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ChatSession } from '../models/chat.session';
import { ChatMessage } from '../models/chat.message.model';

@scoped(Lifecycle.ContainerScoped)
export class NeedleService {

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private environmentProviderService?: ClientEnvironmentProviderService,
        @inject(GetHeaders) private getHeaders?: GetHeaders,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider
    ) {}

    async needleRequestForREAN (method: string, url:string, accessToken?, obj?, api_key?) {
        try {
            const ReanBackendBaseUrl = process.env.REAN_APP_BACKEND_BASE_URL;
            if (!accessToken) {
                accessToken = null;
            }
            let options = await this.getHeaders.getHeaders(accessToken);
            if (api_key){
                options = await this.getHeaders.getHeaders(accessToken,api_key);
            }
            const apiUrl = ReanBackendBaseUrl + url;
            let response = null;
            if (method === "get") {
                response = await needle(method, apiUrl, options);

            } else {
                response = await needle(method, apiUrl, obj, options);
            }

            if (response.statusCode === 200 || response.statusCode === 201) {
                console.log('Reancare Api is successfull');
            } else {
                console.log("Failed to get response from Reancare API.");
            }

            return response.body;
        } catch (error) {
            console.log(error);

        }
    }

    async getPhoneNumber(eventObj: any) {
        const b = eventObj.body.session;
        let phoneNumber = b.split("/", 5)[4];
        if (!phoneNumber) {
            throw new Error('Missing required parameter PhoneNumber!');
        }
        if (phoneNumber.length > 10 && phoneNumber.indexOf('+') === -1) {
            phoneNumber = '+' + phoneNumber;
        }

        // adding "-" if phone number does not contain one.
        const ten_digit = phoneNumber.substr(phoneNumber.length - 10);
        const country_code = phoneNumber.split(ten_digit)[0];
        if (phoneNumber.length > 10 && phoneNumber.indexOf('-') === -1) {
            phoneNumber = `${country_code}-${ten_digit}`;
        }
        return phoneNumber;
    }

    async needleRequestForWhatsappMeta(method: string, endPoint:string, postDataMeta?, payload?){
        const whatsappHost = this.environmentProviderService.getClientEnvironmentVariable("META_WHATSAPP_HOST");
        const version = process.env.WHATSAPP_API_VERSION;
        const options = getRequestOptions();
        const whatsappToken = this.environmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
        options.headers['Content-Type'] = 'application/json';
        options.headers['Authorization'] = `Bearer ${whatsappToken}`;
        const whatsappPhoneNumberID = this.environmentProviderService.getClientEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID");
        const url = `/${version}/${whatsappPhoneNumberID}/${endPoint}`;
        const whatsappaApi = whatsappHost + url;
        let response = null;
        if (method === "get") {
            response = await needle(method, whatsappaApi, options);

        } else {
            response = await needle(method, whatsappaApi, postDataMeta, options);
        }
        console.log("The response is: ", response.body);
        if (response.statusCode === 200 || response.statusCode === 201) {
            const responseObject = await this.createResponseObject('whatsappMeta', payload);
            await this.saveResponsetoDB(responseObject);
            console.log('Whatsapp Api is successfull');
        } else {
            throw new Error("Needle Request for Whatsapp MetaFailed");
        }

        return response.body;
    }

    async needleRequestForTelegram(method: string, endPoint:string, obj?, payload?){
        const telegramHost = this.environmentProviderService.getClientEnvironmentVariable("TELEGRAM_HOST");
        const options = getRequestOptions();
        const telegramBotToken = this.environmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN");
        const url = `/bot${telegramBotToken}/${endPoint}`;
        const telegramApi = telegramHost + url;
        console.log("The telegram URL is:" + telegramApi);
        let response = null;
        try {
            if (method === "get") {
                response = await needle(method, telegramApi, options);

            } else {
                console.log('The body of the request is' + JSON.stringify(obj));
                response = await needle(method, telegramApi, obj, options);
            }
            console.log("The response is: ", response.body);
        } catch (error) {
            console.log("The error is: ", error);
        }

        if (response.statusCode === 200 || response.statusCode === 201) {
            const responseObject = await this.createResponseObject('Telegram', payload);
            await this.saveResponsetoDB(responseObject);
            console.log('Telegram Api is successfull');
        } else {
            throw new Error("Failed");
        }

        return response.body;
    }

    async needleRequestForWhatsapp(method: string, endPoint:string, obj?){
        const options = getRequestOptions();
        options.headers['Content-Type'] = 'application/json';
        options.headers['D360-Api-Key'] = this.environmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY");
        const hostname = this.environmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST");
        const apiUrl = "https://" + hostname + endPoint;
        // eslint-disable-next-line init-declarations
        await needle.post(apiUrl, obj, options, function(err, resp) {
            if (err) {
                console.log("err", err);
            }
            console.log("resp", resp.body);
            return (resp.body);
        });
    }

    saveResponsetoDB = async(responseObject) => {
        // eslint-disable-next-line max-len
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.environmentProviderService)).getRepository(ChatSession);
        const chatSessionModel = await chatSessionRepository.findOne({
            where : {
                userPlatformID : responseObject.chat_id
            }
        });
        let chatSessionId = null;
        if (chatSessionModel) {
            chatSessionId = chatSessionModel.autoIncrementalID;
        }
        const dfResponseObj = {
            chatSessionID  : chatSessionId,
            platform       : responseObject.platform,
            direction      : responseObject.direction,
            messageType    : responseObject.messageType,
            messageContent : responseObject.messageContent,
            imageContent   : responseObject.imageContent,
            imageUrl       : responseObject.imageUrl,
            userPlatformID : responseObject.userPlatformID,
            intent         : responseObject.intent
        };
        // eslint-disable-next-line max-len
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.environmentProviderService)).getRepository(ChatMessage);
        await (await chatMessageRepository.create(dfResponseObj)).save();

    };

    createResponseObject = async(channel: string, payload?) => {
        const responseObject = {
            chatSessionID  : null,
            platform       : channel,
            direction      : 'Out',
            messageType    : payload.completeMessage.type,
            messageContent : payload.completeMessage.messageBody,
            imageContent   : null,
            imageUrl       : payload.completeMessage.imageUrl,
            userPlatformID : payload.completeMessage.platformId,
            intent         : payload.completeMessage.intent,
            chat_id        : payload.completeMessage.chat_message_id,
        };
        return responseObject;
    };

}
