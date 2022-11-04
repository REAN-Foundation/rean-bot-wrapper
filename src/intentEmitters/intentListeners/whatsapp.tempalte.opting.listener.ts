import { Logger } from '../../common/logger';
import { WhatsAppOptingOption } from '../../services/template.opting.option';

// const liveAgent: LiveAgent = container.resolve(LiveAgent);

export const WhatsAppTemplateOpting = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log(`${intent} Intent!!!`);

            // Service Call
            let response = null;

            // res = 5;

            const optingOption = new WhatsAppOptingOption();
            response = await optingOption.whatsAppOptingOptions(eventObj.body, intent);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, `${intent} Intent Error!`);
            reject(error.message);
        }
    });
};
