import { Logger } from '../../common/logger';
import { FeedbackService } from '../../services/feedback/feedback.service';

export const PositiveFeedbackListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Positive Feedback received!!!!!');
        
        let response = null;
        const feedbackService = eventObj.container.resolve(FeedbackService);
        response = await feedbackService.PositiveFeedback(eventObj);
        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error('Positive feedback service failed');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Positive Feedback Listener Error!');
        throw new Error("Positive feedback listener error");
    }
};
