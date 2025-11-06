import { Logger } from '../../common/logger.js';
import { ChangeLanguage } from '../../services/language.change.service.js';

export const LanguageChangeListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Change Language Intent!!!!!');

        let response = null;
        const changeLanguage = eventObj.container.resolve(ChangeLanguage);
        response = await changeLanguage.askForLanguage(eventObj);

        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error('Language Change Failed');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Change Language Intent Error!');
        throw new Error("Language change intent error");
    }
};
