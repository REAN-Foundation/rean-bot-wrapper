import { Logger } from '../../common/logger';
import { FeedbackService } from '../../services/feedback/feedback.service';
import { Loader } from '../../startup/loader';

export const NegativeFeedbackListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Negative Feedback received!!!!!');

        let response = null;
        eventObj.container = Loader.container;
        const feedbackService = eventObj.container.resolve(FeedbackService);
        response = await feedbackService.NegativeFeedback(eventObj);

        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error("Negative feedback service failed");
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Negative Feedback Listener Error!');
        throw new Error("Negative feedback listener error");
    }
};
