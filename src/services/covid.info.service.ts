import needle from 'needle';
import { Logger } from '../common/logger.js';
import { getRequestOptions } from '../utils/helper.js';

export class getCovidInfoResources{

    covidInfoResourcesforAPIs = async (api) => {
        try {
            Logger.instance().log(`Get CovidInfo ${api}`);

            const options = getRequestOptions();
            const url = 'https://test.api.net';
            const response = await needle("get", url, options);
            if (response.statusCode !== 200) {
                throw new Error("Failed to get response from " + api + ".");
            }

            return { covid_info: response.body };
        }
        catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Info Service Error!");
            throw new Error("Covid Info Service Error");
        }
    };

}
