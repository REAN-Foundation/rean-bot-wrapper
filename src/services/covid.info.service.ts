import needle from 'needle';
import { Logger } from '../common/logger';
import { getRequestOptions } from '../utils/helper';

export class getCovidInfoResources{

    covidInfoResourcesforAPIs = async (api) => {
        return new Promise(async (resolve, reject) => {
            try {
                Logger.instance().log(`Get CovidInfo ${api}`);

                const options = getRequestOptions();
                const url = 'https://test.api.net';
                const response = await needle("get", url, options);
                if (response.statusCode !== 200) {
                    reject("Failed to get response from " + api + ".");
                }

                resolve({ covid_info: response.body });
            }
            catch (error) {
                Logger.instance().log_error(error.message, 500, "Covid Info Service Error!");
                reject(error.message);
            }
        });
    };

}
