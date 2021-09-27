//const Logger.instance() = require('../utils/Logger.instance()');
// const Helper = require('../utils/Helper');
import needle from 'needle';
import { Logger } from '../common/logger';
import { getRequestOptions } from '../utils/Helper';
export const getCovidInfo1 = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get CovidInfo API-1`);

            const options = getRequestOptions();
            const url = 'https://test.api.net';
            const response = await needle("get", url, options);
            if (response.statusCode != 200) {
                reject("Failed to get response from API-1.");
            }

            resolve({ covid_info: response.body });
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Info Service Error!");
            reject(error.message);
        }
    });
};

export const getCovidInfo2 = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get CovidInfo API-2`);

            const options = getRequestOptions();
            const url = 'https://test.api.net';
            const response = await needle("get", url, options);

            if (response.statusCode != 200) {
                reject("Failed to get response from API-2.");
            }

            resolve({ covid_info: response.body });
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Info Service Error!");
            reject(error.message);
        }
    });
};

export const getCovidResources1 = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get CovidResource API-1`);

            const options = getRequestOptions();
            const url = 'https://test.api.net';
            const response = await needle("get", url, options);
            if (response.statusCode !== 200) {
                reject("Failed to get response from API-1.");
            }

            resolve({ covid_resources: response.body });
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Info Service Error!");
            reject(error.message);
        }
    });
};

export const getCovidResources2 = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get CovidResource API-2`);

            const options = getRequestOptions();
            const url = 'https://test.api.net';
            const response = await needle("get", url, options);

            if (response.statusCode !== 200) {
                reject("Failed to get response from API-2.");
            }

            resolve({ covid_resources: response.body });
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Info Service Error!");
            reject(error.message);
        }
    });
};
