import { Logger } from '../../common/logger';
import { FeedbackService } from '../../services/feedback/feedback.service';

export const NegativeFeedbackListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('Negative Feedback received!!!!!');

            // Service Call
            let response = null;

            // res = 5;
            console.log("eventobj", eventObj.body.originalDetectIntentRequest.payload.source);
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            const feedbackService = new FeedbackService();
            response = await feedbackService.NegativeFeedback(payload);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Negative Feedback Listener Error!');
            reject(error.message);
        }
    });
};
