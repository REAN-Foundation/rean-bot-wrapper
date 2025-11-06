import { Logger } from '../../common/logger.js';
import { ExampleAnemiaImage } from '../../services/example.anemia.image.js';

export const ExampleAnemiaImageListener = async (intent, eventObj) => {
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
            throw new Error('Failed');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Example anemia image Listener Error!');
        throw new Error("Example anemia image listener error");
    }
};
