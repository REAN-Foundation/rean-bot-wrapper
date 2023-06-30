
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
        @inject(GetHeaders) private getHeaders?: GetHeaders
    ) {}

    async needleRequestForREAN (method: string, url:string, accessToken?, obj?) {
        const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        if (!accessToken) {
            accessToken = null;
        }
        const options = this.getHeaders.getHeaders(accessToken);
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

    async needleRequestForWhatsappMeta(method: string, endPoint:string, postDataMeta?){
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
            response = await needle(method, whatsappaApi, postDataMeta, options);
        }
        console.log("The response is: ", response.body);
        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log('Whatsapp Api is successfull');
        } else {
            throw new Error("Needle Request for Whatsapp MetaFailed");
        }
    
        return response.body;
    }

    async needleRequestForTelegram(method: string, endPoint:string, obj?){
        const telegramHost = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_HOST");
        const options = getRequestOptions();
        const telegramBotToken = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN");
        const url = `/bot${telegramBotToken}/${endPoint}`;
        const telegramApi = telegramHost + url;
        console.log("The telegram URL is:"+ telegramApi);
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
            console.log('Telegram Api is successfull');
        } else {
            throw new Error("Failed");
        }
    
        return response.body;
    }

    async needleRequestForWhatsapp(method: string, endPoint:string, obj?){
        const options = getRequestOptions();
        options.headers['Content-Type'] = 'application/json';
        options.headers['D360-Api-Key'] = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY");
        const hostname = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST");
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

}
