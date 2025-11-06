
import { sendExtraMessages } from "../../services/send.extra.messages.service.js";
import { Logger } from "../../common/logger.js";
import { kerotoplastyService } from "../../services/kerotoplasty.service.js";

export const kerotoplastyConditionIdentificationListener = async (intent, eventObj) => {

    const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
    try {
        const condition = await kerotoplastyServiceObj.identifyCondition(eventObj);
        const [response,severityGrade] = await kerotoplastyServiceObj.conditionSpecificResponse(condition);
        askingForImage(intent,eventObj,severityGrade);
        return response;
    }
    catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'kerotoplasty_bot_condition identification Listener Error!');
        throw new Error("Keratoplasty bot condition identification Listener Error");
    }
};
async function askingForImage(intent,eventObj,severityGrade) {
    try {
        const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
        const sendExtraMessagesobj: sendExtraMessages = eventObj.container.resolve(sendExtraMessages);
        const inputMessage =  "Would you like to send an image of the affected area for the doctor's reference?";
        const yesIntentName = "EyeImage";
        const noIntentName = "responseNo";
        sendExtraMessagesobj.sendSecondaryButtonMessage(inputMessage, yesIntentName, noIntentName,  eventObj);
        kerotoplastyServiceObj.postingOnClickup(intent,eventObj,severityGrade);
    } catch (error) {
        console.log(error);
        throw new Error("Keratoplasty next steps error");
    }
}
