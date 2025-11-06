import { Logger } from '../../common/logger.js';
import { WelcomeIntentService } from '../../services/welcome.intent.service.js';

export const WelcomeIntentListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Default Welcome Instance!!!!!');

        let response = null;
        const welcomeService = eventObj.container.resolve(WelcomeIntentService);
        response = await welcomeService.welcomeUser(eventObj);

        if (!response) {
            console.log('I am failed');
            throw new Error('Default welcome service failed');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Default welcome Listener Error!');
        throw new Error("Default welcome listener error");
    }
};
