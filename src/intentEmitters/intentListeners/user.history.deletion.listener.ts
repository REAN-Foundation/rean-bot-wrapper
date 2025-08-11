import { Logger } from '../../common/logger';
import { userHistoryDeletionService } from '../../services/user.history.deletion.service';

export const UserChatHistoryDeletionListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('User Chat History Deletion Listener!!!');

        const userDeletionService = eventObj.container.resolve(userHistoryDeletionService);

        const userPlatformId = eventObj.body.originalDetectIntentRequest.payload.userId;
        if (userPlatformId) {
            await userDeletionService.deleteChatHistory(userPlatformId);
        }
        else {
            console.log("User Platform Id not found.");
        }

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Error while handling the user chat history deletion listener');
        throw new Error("User Chat History Deletion listener error");
    }
};