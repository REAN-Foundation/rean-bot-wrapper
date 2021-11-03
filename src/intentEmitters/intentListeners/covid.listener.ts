import { Logger } from '../../common/logger';

// eslint-disable-next-line max-len
// import { getCovidInfo1 , getCovidInfo2, getCovidResources1, getCovidResources2 } from '../../services/covid.info.service';
import { getCovidInfoResources } from '../../services/covid.info.service';

const getCovidInfoResourcesobj = new getCovidInfoResources();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCovidInfo1s = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling Covid Info-1 Service');

            const response: any = await getCovidInfoResourcesobj.covidInfoResourcesforAPIs("API-1");

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCovidInfo2s = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling Covid Info-2 Service');

            const response: any = await getCovidInfoResourcesobj.covidInfoResourcesforAPIs("API-2");

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCovidResources1s = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling Covid Resource-2 Service');

            const response: any = await getCovidInfoResourcesobj.covidInfoResourcesforAPIs("API-1");

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCovidResources2s = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling Covid Resource-2 Service');

            const response: any = await getCovidInfoResourcesobj.covidInfoResourcesforAPIs("API-2");

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
