import { Logger } from '../../common/logger';
import { OptOut } from '../../services/OptOut.service';

// const liveAgent: LiveAgent = container.resolve(LiveAgent);

export const WhatsAppOptOut = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('WhatsAppOptOut Intent!!!!!');

            // Service Call
            let response = null;

            // res = 5;
            const optOut = new OptOut();
            response = await optOut.whatsAppOptOut(eventObj.body);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'WhatsAppOptOut Intent Error!');
            reject(error.message);
        }
    });
};
