import { Logger } from "../../common/logger.js";
import { CalorieFeedback } from "../../services/calories/calorie.feedback.service.js";

export const CalorieUpdate = async ( intent, eventObj ) => {
    const calorie_Feedback:CalorieFeedback = eventObj.container.resolve(CalorieFeedback);
    try {
        Logger.instance()
            .log("Calorie Updating!!!!");

        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const res = await calorie_Feedback.updateCalories(eventObj, payload.userId);

        return res;
    } catch (error) {
        Logger.instance()
            .log_error(error.message,500,'Calorie updating failed');
        throw new error("Calorie updating failed");
    }
};
