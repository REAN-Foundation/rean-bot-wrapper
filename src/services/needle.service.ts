
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { container } from 'tsyringe';
import needle from "needle";
import { getHeaders } from './biometrics/get.headers';
import { getRequestOptions } from '../utils/helper';

export const needleRequestForREAN = async (method: string,
    url:string, accessToken?, obj?) => {
    const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
        ClientEnvironmentProviderService);
    const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
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
};

export const getPhoneNumber = async (eventObj: any) => {
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
};

export const needleRequestForWhatsapp = async (method: string, endPoint:string, obj?) => {
    const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
        ClientEnvironmentProviderService);
    const whatsappHost = clientEnvironmentProviderService.getClientEnvironmentVariable("META_WHATSAPP_HOST");
    const options = getRequestOptions();
    const whatsappToken = clientEnvironmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
    options.headers['Content-Type'] = 'application/json';
    options.headers['Authorization'] = `Bearer ${whatsappToken}`;
    const whatsappPhoneNumberID = clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID");
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
};

export const needleRequestForTelegram = async (method: string, endPoint:string, obj?) => {
    const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
        ClientEnvironmentProviderService);
    const telegramHost = clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_HOST");
    const options = getRequestOptions();
    const telegramBotToken = clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN");
    const url = `/bot${telegramBotToken}/${endPoint}`;
    const telegramApi = telegramHost + url;
    let response = null;
    if (method === "get") {
        response = await needle(method, telegramApi, options);

    } else {
        response = await needle(method, telegramApi, obj, options);
    }

    if (response.statusCode === 200 || response.statusCode === 201) {
        console.log('Whatsapp Api is successfull');
    } else {
        throw new Error("Failed");
    }

    return response.body;
};
