import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { NeedleService } from "../../services/needle.service";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";

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
        const needleService: NeedleService = eventObj.container.resolve(NeedleService);

        const location_response = await kerotoplastyServiceObj.conditionSpecificResponse(intent,eventObj);
        const postData = {
            chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
            text    : location_response
        };
        await needleService.needleRequestForTelegram("post", "sendMessage", postData);
        await kerotoplastyServiceObj.postingOnClickup(intent,eventObj);
        console.log("STEP 5! Final");
    } catch (error) {
        console.log(error);
    }
}
