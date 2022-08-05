import { Logger } from '../../common/logger';
import { OptIn } from '../../services/OptIn.service';

// const liveAgent: LiveAgent = container.resolve(LiveAgent);

export const WhatsAppOptIn = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('WhatsAppOptIn Intent!!!!!');

            // Service Call
            let response = null;

            // res = 5;
            const optOut = new OptIn();
            response = await optOut.whatsAppOptIn(eventObj.body);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'WhatsAppOptIn Intent Error!');
            reject(error.message);
        }
    });
};
