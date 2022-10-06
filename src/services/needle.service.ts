
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { container } from 'tsyringe';
import needle from "needle";
import { getHeaders } from './biometrics/get.headers';

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
    console.log(apiUrl);
    let response = null;
    if (method === "get") {
        response = await needle(method, apiUrl, options);

    } else {
        response = await needle(method, apiUrl, obj, options);
    }

    if (response.statusCode !== 200) {
        throw new Error("Failed to get response from API.");
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

