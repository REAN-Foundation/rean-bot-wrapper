import { Logger } from '../../common/logger';
import { UserInfoService } from '../../services/user.info/user.info.service';

export const UserInfoListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('User Info Listenere!!!');

        const userInfoService = eventObj.container.resolve(UserInfoService);

        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const parameters = eventObj.body.queryResult.parameters;
        
        if (parameters.Name?.name) {
            parameters.Name = parameters.Name.name;
        }

        await userInfoService.updateUserInfo(payload.userId, parameters);

        console.log('DB Updated successfully for user info');
        const messageText = await userInfoService.getMessageText();
        const message_from_nlp = `Thank You ${parameters.Name}. ${messageText}`;

        const data = {
            "fulfillmentMessages" : [
                {
                    "text" : {
                        "text" : [
                            message_from_nlp
                        ]
                    }
                }
            ]
        };
        return data;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Error while handling the user info listener');
        throw new Error("User Info listener error");
    }
};