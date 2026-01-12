// import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";
// import { CallEyeImageQualityCheckModel } from '../../services/call.eye.image.quality.check';
import { sendExtraMessages } from "../../services/send.extra.messages.service";

export const kerotoplastyEyeQualityListener = async (intent:string, eventObj) => {
    const dialogflowMsgFormatObj: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
    // const message = "We are checking the quality of image";
    const message = "✅ We’ve successfully received your photo. The *quality looks good* for further assessment";
    const to_send = await dialogflowMsgFormatObj.making_response(message);
    eyeImageQuality(eventObj);
    return to_send;
 
};

async function eyeImageQuality(eventObj){
    try {
        // const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
        const sendExtraMessagesobj: sendExtraMessages = eventObj.container.resolve(sendExtraMessages);
        // const EyeImgQultyModel: CallEyeImageQualityCheckModel =
        //  eventObj.container.resolve(CallEyeImageQualityCheckModel);
        // const [message, goodQuality] =
        // await EyeImgQultyModel.getEyeImageQualityCheckModelResponse(eventObj.body.queryResult.queryText,eventObj);
        // if (goodQuality === true) {
        //     await sendExtraMessagesobj.sendExtraMessage(eventObj, intent, message);
        // }
        // else {
        //     const yesIntentName = "EyeImage";
        //     const noIntentName = "responseNo";
        //     await sendExtraMessagesobj.sendSecondaryButtonMessage(message, yesIntentName, noIntentName,  eventObj);
        // }

        const message = 
        "Are you taking your prescribed medications regularly?\n\n";
        const yesIntentName = "responseYes";
        const noIntentName = "responseNo";
        sendExtraMessagesobj.sendSecondaryButtonMessage(message, yesIntentName, noIntentName,  eventObj);
        // kerotoplastyServiceObj.postingOnClickup(intent,eventObj,1);
        // const repetitionFlag = await kerotoplastyServiceObj.postingImage(eventObj);
        // if (repetitionFlag !== "True"){
        //     const inputMessage = `Would you like to request an appointment?`;
        //     const yesIntentName = "BookAppointment";
        //     const noIntentName = "responseNo";
        //     sendExtraMessagesobj.sendSecondaryButtonMessage(inputMessage, yesIntentName, noIntentName,  eventObj);
        // }
    } catch (error) {
        console.log(error);
    }
}
