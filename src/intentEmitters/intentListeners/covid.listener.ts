import { Logger } from '../../common/logger';
import { getCovidInfoResources } from '../../services/covid.info.service';

export const getCovidInfo1s = async (intent, eventObj) => {
    const getCovidInfoResourcesobj:getCovidInfoResources = eventObj.container.resolve(getCovidInfoResources);
    try {
        Logger.instance().log('Calling Covid Info-1 Service');

        const response: any = await getCovidInfoResourcesobj.covidInfoResourcesforAPIs("API-1");

        if (!response || !response.covid_info) {
            throw new Error(response);
        }
        return response;

    } catch (error) {
        Logger.instance().log_error(error.message, 500, "Covid Listener Error!" + error.message);
        throw new Error("Covid Listener Error!");
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCovidInfo2s = async (intent, eventObj) => {
    const getCovidInfoResourcesobj:getCovidInfoResources = eventObj.container.resolve(getCovidInfoResources);
    try {
        Logger.instance().log('Calling Covid Info-2 Service');

        const response: any = await getCovidInfoResourcesobj.covidInfoResourcesforAPIs("API-2");

        if (!response || !response.covid_info) {
            throw new Error(response);
        }

        return response;

    } catch (error) {
        Logger.instance().log_error(error.message, 500, "Covid Listener Error!" + error.message);
        throw new Error("Covid Listener Error!");
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCovidResources1s = async (intent, eventObj) => {
    const getCovidInfoResourcesobj:getCovidInfoResources = eventObj.container.resolve(getCovidInfoResources);
    try {
        Logger.instance().log('Calling Covid Resource-2 Service');

        const response: any = await getCovidInfoResourcesobj.covidInfoResourcesforAPIs("API-1");

        if (!response || !response.covid_resources) {
            throw new Error(response);
        }

        return response;

    } catch (error) {
        Logger.instance().log_error(error.message, 500, "Covid Listener Error!" + error.message);
        throw new Error("Covid Listener Error!");
    }
};

export const getCovidResources2s = async (intent, eventObj) => {
    const getCovidInfoResourcesobj:getCovidInfoResources = eventObj.container.resolve(getCovidInfoResources);
    try {
        Logger.instance().log('Calling Covid Resource-2 Service');

        const response: any = await getCovidInfoResourcesobj.covidInfoResourcesforAPIs("API-2");

        if (!response || !response.covid_resources) {
            throw new Error(response);
        }

        return response;

    } catch (error) {
        Logger.instance().log_error(error.message, 500, "Covid Listener Error!" + error.message);
        throw new Error("Covid Listener Error!");
    }
};
