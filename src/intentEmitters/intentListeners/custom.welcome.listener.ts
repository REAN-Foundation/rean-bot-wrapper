/* eslint-disable @typescript-eslint/no-var-requires */
import { Logger } from '../../common/logger';
import { CustomWelcomeService } from '../../services/custom.welcome.service';

export const CustomWelcomeIntent = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        try {
            Logger.instance()
                .log('Custom Welcome Intent!!!!!');

            let response = null;
            const WelcomeService = new CustomWelcomeService();

            const payload = eventObj.body.originalDetectIntentRequest.payload;
            const toCheckSession = await WelcomeService.checkSession(payload.userId);
            const imageUrl = await WelcomeService.getImageUrl();

            if (toCheckSession) {
                response = {
                    "followupEventInput" : {
                        "name"         : "DefaultWelcomeIntent",
                        "languageCode" : "en-US"
                    }
                };
                await WelcomeService.postResponseCustom(payload.userId,payload.source,imageUrl);
            } else {
                response = {
                    "followupEventInput" : {
                        "name"         : "customlanguage",
                        "languageCode" : "en-US"
                    }
                };
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Custom Welcome Intent Error!');
            reject(error.message);
        }
    });
};
