import { Logger } from '../../common/logger';
import { send_message } from '../../services/slack.service';

export const handleIntentFufillmentError = async (_intent, eventObj) => {
    // eslint-disable-next-line init-declarations
    let response;
    try {
        const intentName = eventObj.queryResult ? eventObj.queryResult.intent.displayName : null;
        const failureReason = eventObj.failureReason;
        const params = eventObj.queryResult.parameters;

        Logger.instance()
            .log(`Handle unfulfilled intent: ${intentName}`);

        // TODO: Send message to slack channel
        const message = `Failed to fulfill intent \`${intentName}\``;
        response = await send_message(message, failureReason, params, eventObj);

        // TODO: Send message to other channels/JIRA

        if (!response) {
            throw new Error("No response in fallback listener");
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Fallback Listener Error!');
        throw new Error("Fallback listener error");
    }
};
