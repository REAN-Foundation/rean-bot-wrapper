import { Logger } from '../../common/logger';
import { userHistoryDeletionService } from '../../services/user.history.deletion.service';
import { SystemGeneratedMessagesService } from "../../services/system.generated.message.service";

export const UserChatHistoryDeletionListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('User Chat History Deletion Listener!!!');

        const userDeletionService = eventObj.container.resolve(userHistoryDeletionService);
        const systemGeneratedMessages = eventObj.container.resolve(SystemGeneratedMessagesService);

        const userPlatformId = eventObj.body.originalDetectIntentRequest.payload.userId;
        if (userPlatformId) {
            let userReply = eventObj.body.queryResult.parameters.UserResponse;
            let reply = null;
            if (!eventObj.body.queryResult.parameters.Language) {
                userReply = eventObj.body.queryResult.queryText.toLowerCase();
            }
            if (userReply.toLowerCase() === "yes") {
                await userDeletionService.deleteUserFromAllServices(userPlatformId);
                reply = await systemGeneratedMessages.getMessage("DELETE_YES_MESSAGE");
                if (!reply) {
                    reply = "User History Deleted Successfully";
                }
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    reply
                                ]
                            }
                        }
                    ]
                };
                return data;
            } else {
                reply = await systemGeneratedMessages.getMessage("DELETE_NO_MESSAGE");
                if (!reply) {
                    reply = "User History Deletion Cancelled";
                }
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    reply
                                ]
                            }
                        }
                    ]
                };
                return data;
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