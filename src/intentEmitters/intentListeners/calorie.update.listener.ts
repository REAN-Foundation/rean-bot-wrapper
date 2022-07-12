import { Logger } from "../../common/logger";
import { CalorieFeedback } from "../../services/calories/calorie.feedback.service";

export const CalorieUpdate = async ( intent, eventObj ) => {
    const calorie_Feedback = new CalorieFeedback();
    return new Promise(async (resolve,reject) => {
        try {
            Logger.instance()
                .log("Calorie Updating!!!!");

            const payload = eventObj.body.originalDetectIntentRequest.payload;
            const res = await calorie_Feedback.updateCalories(eventObj, payload.userId);

            resolve(res);
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Calorie updating failed');
        }
    });
};