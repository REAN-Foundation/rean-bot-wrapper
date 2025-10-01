import { Logger } from '../../common/logger';
import { userHistoryDeletionService } from '../../services/user.history.deletion.service';

export const UserChatHistoryDeletionListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('User Chat History Deletion Listener!!!');

        const userDeletionService = eventObj.container.resolve(userHistoryDeletionService);

        const userPlatformId = eventObj.body.originalDetectIntentRequest.payload.userId;
        if (userPlatformId) {
            let userReply = eventObj.body.queryResult.parameters.UserResponse;
            if (!eventObj.body.queryResult.parameters.Language) {
                userReply = eventObj.body.queryResult.queryText
            }
            if (userReply === "Yes") {
                await userDeletionService.deleteUserFromAllServices(userPlatformId);
                Logger.instance()
                    .log(`User with platform ID ${userPlatformId} has been deleted from all services.`);
            }
        }
        else {
            Logger.instance()
                .log('No userPlatformId found in the request payload.');
        }

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Error while handling the user chat history deletion listener');
        throw new Error("User Chat History Deletion listener error");
    }
};