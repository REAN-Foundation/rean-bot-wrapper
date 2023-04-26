import { CalorieService } from "../../services/calorie.service";
import { Logger } from "../../common/logger";
import { GetCalories } from "../../services/get.calorie.service";

export const calorieDetection = async ( intent, eventObj ) => {
    const calorieservice:CalorieService = eventObj.container.resolve(CalorieService);
    try {
        Logger.instance()
            .log("Calling food info service !!!!");
        let response = null;

        const payload = eventObj.body.originalDetectIntentRequest.payload;

        response = await calorieservice.handleMessageCalorie(payload.sessionId,payload.source,eventObj);

        if (eventObj.body.originalDetectIntentRequest.source === "DIALOGFLOW_CONSOLE"){
            return response;
        } else {
            calorieNextSteps(eventObj, calorieservice, payload);
            return response;
        }
    } catch (error) {
        Logger.instance()
            .log_error(error.message,500,'Food info listener error');
        throw new Error("Food info listener error");
    }
};

async function calorieNextSteps(eventObj, calorieservice, payload){
    const getCalorieService = new GetCalories();
    // eslint-disable-next-line max-len
    const calorieData = await getCalorieService.getCalorieData(eventObj.body.queryResult.parameters, eventObj.body.queryResult.queryText, payload);
    console.log("We revieved the calorie data");
    console.log(calorieData);
    await calorieservice.postResponseCalorie(payload.userId,payload.source,calorieData.text);
}
