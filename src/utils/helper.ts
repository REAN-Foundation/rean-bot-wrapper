import { Logger } from '../common/logger';

export const someHelper = () => {
    Logger.instance().log("Hello some helper");
    return true;
};

// https://www.npmjs.com/package/needle
export const getRequestOptions = (service = 'default') => {
    const request_options: any = {
        open_timeout     : 10000,        // connection open timeout in ms
        response_timeout : 60000     // response timeout in ms
    };

    // Any headers goes here
    const headers = {};

    // Any service specific Needle option can be handled here ...
    switch (service) {
    case 'vaccine':
        request_options.response_timeout = 60000;

        headers["User-Agent"] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36';
        break;
    default:
        break;
    }

    request_options.headers = headers;

    return request_options;
};
