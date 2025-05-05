import { Logger } from '../../common/logger';
import { UserInfoService } from '../../services/user.info/user.info.service';

export const UserInfoListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('User Info Listenere!!!');

        const userInfoService = eventObj.container.resolve(UserInfoService);

        let response = null;
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const parameters = eventObj.body.queryResult.parameters;

        await userInfoService.updateUserInfo(payload.userId, parameters);

        console.log('DB Updated successfully for user info');

        response = {
            "followupEventInput" : {
                "name"         : "ThankYouWelcomeMessage",
                "languageCode" : "en-US"
            }
        };
        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Error while handling the user info listener');
        throw new Error("User Info listener error");
    }
};