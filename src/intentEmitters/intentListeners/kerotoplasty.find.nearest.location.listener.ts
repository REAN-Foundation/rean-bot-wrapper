import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";
import { getAdditionalInfoSevice } from "../../services/get.additional.info.service";
import { translateService } from "../../services/translate.service";

export const kerotoplastyLocationListener = async (intent:string, eventObj) => {
    // eslint-disable-next-line max-len
    const dialoflowMessageFormattingObj: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
    const response = "We are processing your request. Please wait for a while.";
    const to_send = dialoflowMessageFormattingObj.making_response(response);
    keratoplastyNextSteps(intent,eventObj);
    return to_send;
};

async function keratoplastyNextSteps(intent,eventObj) {
    try {
        console.log("STEP 4");
        const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
        const location_response = await kerotoplastyServiceObj.conditionSpecificResponse(intent);
        const additionalObj: getAdditionalInfoSevice = eventObj.container.resolve(getAdditionalInfoSevice);
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const languageCode = eventObj.body.queryResult.languageCode;
        const translationServiceObj: translateService = eventObj.container.resolve( translateService);
        const button_yes = await translationServiceObj.translatestring("Yes",languageCode);
        const button_no = await translationServiceObj.translatestring("No",languageCode);
        const buttonArray = [button_yes, "BookAppointment",button_no,"AppoinmentNotNeeded"];
        additionalObj.sendResponsebyButton(location_response,eventObj, userId,buttonArray);
        kerotoplastyServiceObj.postingOnClickup(intent,eventObj);


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
