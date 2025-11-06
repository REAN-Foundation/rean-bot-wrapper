import { Logger } from '../../common/logger.js';
import { ChangeLanguage } from '../../services/language.change.service.js';
import { CustomWelcomeService } from '../../services/custom.welcome.service.js';

export const CustomLanguageListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Change Language Intent!!!!!');

        let response = null;
        const payload = eventObj.body.originalDetectIntentRequest.payload;

        const WelcomeService = eventObj.container.resolve(CustomWelcomeService);
        const changeLanguage = eventObj.container.resolve(ChangeLanguage);

        response = await changeLanguage.askForLanguage(eventObj);
        const imageUrl = await WelcomeService.getImageUrl();

        console.log('Inside listener: ', response);

        if (!response) {
            throw new Error('Change Language Intent Error! ' + response);
        } else {
            response = {
                "followupEventInput" : {
                    "name"         : "DefaultWelcomeIntent",
                    "languageCode" : "en-US"
                }
            };
            if (imageUrl){
                await WelcomeService.postResponseCustom(payload.userId,payload.source,imageUrl);
            }
        }
        return response;
    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Custom Language Intent Error!');
        throw new Error("Custom language listener error");
    }
};
