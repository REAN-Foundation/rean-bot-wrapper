/* eslint-disable @typescript-eslint/no-var-requires */
import { Logger } from '../../common/logger';
import { CustomWelcomeService } from '../../services/custom.welcome.service';

export const CustomWelcomeIntent = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Custom Welcome Intent!!!!!');

        let response = null;
        const WelcomeService = eventObj.container.resolve(CustomWelcomeService);

        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const toCheckSession = await WelcomeService.checkSession(payload.userId);
        const imageUrl = await WelcomeService.getImageUrl();

        if (toCheckSession.sessionFlag === "nosession") {
            response = {
                "followupEventInput" : {
                    "name"         : "DefaultWelcomeIntent",
                    "languageCode" : "en-US"
                }
            };
            if (imageUrl) {
                await WelcomeService.postResponseCustom(payload.userId,payload.source,imageUrl);
            }
        } else {
            response = {
                "followupEventInput" : {
                    "name"         : "WelcomeMessage",
                    "languageCode" : "en-US"
                }
            };
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Custom Welcome Intent Error!');
        throw new Error("Custom welcome listener error");
    }
};
