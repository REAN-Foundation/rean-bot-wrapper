
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { container, inject, Lifecycle, scoped } from 'tsyringe';
import needle from "needle";
import { GetHeaders } from './biometrics/get.headers';
import { getRequestOptions } from '../utils/helper';

@scoped(Lifecycle.ContainerScoped)
export class NeedleService {
    
    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
    ) {}

    async needleRequestForREAN (method: string, url:string, accessToken?, obj?) {
        const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        if (!accessToken) {
            accessToken = null;
        }
        const options = getHeaders(accessToken);
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
            throw new Error("Failed to get response from Reancare API.");
        }
    
        return response.body;
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

    async needleRequestForWhatsapp(method: string, endPoint:string, obj?){
        const whatsappHost = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_WHATSAPP_HOST");
        const options = getRequestOptions();
        const whatsappToken = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
        options.headers['Content-Type'] = 'application/json';
        options.headers['Authorization'] = `Bearer ${whatsappToken}`;
        const whatsappPhoneNumberID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID");
        const url = `/v14.0/${whatsappPhoneNumberID}/${endPoint}`;
        const whatsappaApi = whatsappHost + url;
        let response = null;
        if (method === "get") {
            response = await needle(method, whatsappaApi, options);
    
        } else {
            response = await needle(method, whatsappaApi, obj, options);
        }
    
        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log('Whatsapp Api is successfull');
        } else {
            throw new Error("Failed");
        }
    
        return response.body;
    }

    async needleRequestForTelegram(method: string, endPoint:string, obj?){
        const telegramHost = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_HOST");
        const options = getRequestOptions();
        const telegramBotToken = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN");
        const url = `/bot${telegramBotToken}/${endPoint}`;
        const telegramApi = telegramHost + url;
        let response = null;
        if (method === "get") {
            response = await needle(method, telegramApi, options);
    
        } else {
            response = await needle(method, telegramApi, obj, options);
        }
    
        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log('Telegram Api is successfull');
        } else {
            throw new Error("Failed");
        }
    
        return response.body;
    }

}
