import { Logger } from '../../common/logger';
import { ExampleAnemiaImage } from '../../services/example.anemia.image';

export const ExampleAnemiaImageListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('Example of Anemia image');

            // Service Call
            let response = null;

            // res = 5;
            console.log("eventobj", eventObj.body.originalDetectIntentRequest.payload.source);
            const testWhatsapp = new ExampleAnemiaImage();
            response = await testWhatsapp.greetings();

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Example anemia image Listener Error!');
            reject(error.message);
        }
    });
};
