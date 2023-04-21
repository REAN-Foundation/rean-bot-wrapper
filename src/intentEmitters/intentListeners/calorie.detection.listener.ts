import { CalorieService } from "../../services/calorie.service";
import { Logger } from "../../common/logger";
import { GetCalories } from "../../services/get.calorie.service";

export const calorieDetection = async ( intent, eventObj ) => {
    const calorieservice = eventObj.container.resolve(CalorieService);
    return new Promise(async (resolve,reject) => {
        try {
            Logger.instance()
                .log("Calling food info service !!!!");
            let response = null;

            const payload = eventObj.body.originalDetectIntentRequest.payload;

            response = await calorieservice.handleMessageCalorie(payload.sessionId,payload.source,eventObj);

            if (eventObj.body.originalDetectIntentRequest.source === "DIALOGFLOW_CONSOLE"){
                resolve(response);
            } else {
                resolve(response);

                const getCalorieService = eventObj.container.resolve(GetCalories);
                // eslint-disable-next-line max-len
                const calorieData = await getCalorieService.getCalorieData(eventObj.body.queryResult.parameters, eventObj.body.queryResult.queryText, payload);
                console.log("We revieved the calorie data");
                console.log(calorieData);
                await calorieservice.postResponseCalorie(eventObj, payload.userId,payload.source,calorieData.text);
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Food info listener error');
        }
    });
};