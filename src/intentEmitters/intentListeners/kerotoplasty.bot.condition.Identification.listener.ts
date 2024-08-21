
import { Logger } from "../../common/logger";
import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { getAdditionalInfoSevice } from "../../services/get.additional.info.service";
import { translateService } from "../../services/translate.service";

export const kerotoplastyConditionIdentificationListener = async (intent, eventObj) => {

    const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
    try {
        const condition = await kerotoplastyServiceObj.identifyCondition(eventObj);
        const [response,severityGrade] = await kerotoplastyServiceObj.conditionSpecificResponse(condition);
        keratoplastyNextSteps(intent,eventObj,severityGrade);
        return response;
    }
    catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'kerotoplasty_bot_condition identification Listener Error!');
        throw new Error("Keratoplasty bot condition identification Listener Error");
    }
};
async function keratoplastyNextSteps(intent,eventObj,severityGrade) {
    try {
        console.log("STEP 4");
        const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
        let message = "Would you like to send an image of the affected area for the doctor's reference?";
        const additionalObj: getAdditionalInfoSevice = eventObj.container.resolve(getAdditionalInfoSevice);
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const languageCode = eventObj.body.queryResult.languageCode;
        const translationServiceObj: translateService = eventObj.container.resolve( translateService);
        const button_yes = await translationServiceObj.translatestring("Yes",languageCode);
        const button_no = await translationServiceObj.translatestring("No",languageCode);
        message  = await translationServiceObj.translatestring(message,languageCode);
        const buttonArray = [button_yes, "EyeImage",button_no,"responseNo"];
        additionalObj.sendResponsebyButton( message,eventObj, userId,buttonArray);
        kerotoplastyServiceObj.postingOnClickup(intent,eventObj,severityGrade);


        // const payload = eventObj.body.originalDetectIntentRequest.payload;
        // payload.completeMessage.messageType = 'text';
        // payload.completeMessage.messageBody = location_response;
        // payload.completeMessage.intent = 'nearest.location.send';
        // if (channel === "whatsappMeta") {
        //     const endPoint = 'messages';
        //     const postData = {
        //         "messaging_product" : "whatsapp",
        //         "recipient_type"    : "individual",
        //         "to"                : eventObj.body.originalDetectIntentRequest.payload.userId,
        //         "type"              : "text",
        //         "text"              : {
        //             "body" : location_response
        //         }
        //     };
        //     await needleService.needleRequestForWhatsappMeta("post", endPoint, JSON.stringify(postData), payload);
        // } else if (channel === "telegram") {
        //     const postData = {
        //         chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
        //         text    : location_response
        //     };
        //     await needleService.needleRequestForTelegram("post", "sendMessage", postData, payload);
        // } else {
        //     throw new Error("Invalid Channel");
        // }
        // await kerotoplastyServiceObj.postingOnClickup(intent,eventObj);
        // console.log("STEP 5! Final");
    } catch (error) {
        console.log(error);
        throw new Error("Keratoplasty next steps error");
    }

    
}
