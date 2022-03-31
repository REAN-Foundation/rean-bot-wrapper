import { Logger } from '../../common/logger';
import { FeedbackService } from '../../services/feedback/feedback.service';

export const PositiveFeedbackListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('Positive Feedback received!!!!!');

            // Service Call
            let response = null;

            // res = 5;
            console.log("eventobj", eventObj.body.originalDetectIntentRequest.payload.source);
            const channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const sessionId = eventObj.body.originalDetectIntentRequest.payload.sessionId;
            const feedbackService = new FeedbackService();
            response = await feedbackService.PositiveFeedback(channel, sessionId);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Positive Feedback Listener Error!');
            reject(error.message);
        }
    });
};
