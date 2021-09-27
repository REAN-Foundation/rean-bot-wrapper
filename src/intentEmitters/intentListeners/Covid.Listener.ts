// Load required services here
import { Logger } from '../../common/logger';

import { getCovidInfo1 , getCovidInfo2, getCovidResources1, getCovidResources2 } from '../../services/CovidInfo.Service';

export const getCovidInfo1s = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling Covid Info-1 Service');

            const response: any = await getCovidInfo1();

            if (!response || !response.covid_info) {
                reject(response);
            }
            resolve(response);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Listener Error!");
            reject(error.message);
        }
    });
};

export const getCovidInfo2s = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling Covid Info-2 Service');

            const response: any = await getCovidInfo2();

            if (!response || !response.covid_info) {
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Listener Error!");
            reject(error.message);
        }
    });
};

export const getCovidResources1s = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling Covid Resource-2 Service');

            const response: any = await getCovidResources1();

            if (!response || !response.covid_resources) {
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Listener Error!");
            reject(error.message);
        }
    });
};

export const getCovidResources2s = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling Covid Resource-2 Service');

            const response: any = await getCovidResources2();

            if (!response || !response.covid_resources) {
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Listener Error!");
            reject(error.message);
        }
    });
};
