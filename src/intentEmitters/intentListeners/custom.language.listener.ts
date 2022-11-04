import { Logger } from '../../common/logger';
import { ChangeLanguage } from '../../services/language.change.service';
import { CustomWelcomeService } from '../../services/custom.welcome.service';

export const CustomLanguageListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        try {
            Logger.instance()
                .log('Change Language Intent!!!!!');

            let response = null;
            const payload = eventObj.body.originalDetectIntentRequest.payload;

            const WelcomeService = new CustomWelcomeService();
            const changeLanguage = new ChangeLanguage();

            response = await changeLanguage.askForLanguage(eventObj);
            const imageUrl = await WelcomeService.getImageUrl();
            
            console.log('Inside listener: ', response);

            if (!response) {
                reject(response);
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
            resolve(response);
        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Custom Language Intent Error!');
            reject(error.message);
        }
    });
};
