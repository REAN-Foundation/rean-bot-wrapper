
import { Logger } from "../../common/logger";
import { kerotoplastyService } from "../../services/kerotoplasty.service";

export const kerotoplastyConditionIdentificationListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
        try {
            const response = await kerotoplastyServiceObj.identifyCondition(eventObj);
            if (!response) {
                throw new Error('kerotoplasty_bot_condition identification Listener Error!');
            }
            else {
                
                resolve(response);
            }
        }
        catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'kerotoplasty_bot_condition identification Listener Error!');
            reject(error.message);
        }
    });
};
