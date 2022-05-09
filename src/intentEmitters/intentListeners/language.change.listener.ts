import { Logger } from '../../common/logger';
import { ChangeLanguage } from '../../services/language.change.service';

export const LanguageChangeListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('Change Language Intent!!!!!');

            // Service Call
            let response = null;

            // res = 5;
            const changeLanguage = new ChangeLanguage();
            response = await changeLanguage.askForLanguage(eventObj);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Change Language Intent Error!');
            reject(error.message);
        }
    });
};
