import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";
import { CallEyeImageQualityCheckModel } from '../../services/call.eye.image.quality.check';
import { sendExtraMessages } from "../../services/send.extra.messages.service";

export const kerotoplastyEyeQualityListener = async (intent:string, eventObj) => {
    const dialogflowMsgFormatObj: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
    const message = "We are checking the quality of image";
    const to_send = await dialogflowMsgFormatObj.making_response(message);
    eyeImageQuality(eventObj,intent);
    return to_send;
 
};

async function eyeImageQuality(eventObj,intent){
    try {
        const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
        const sendExtraMessagesobj: sendExtraMessages = eventObj.container.resolve(sendExtraMessages);
        const EyeImgQultyModel: CallEyeImageQualityCheckModel =
         eventObj.container.resolve(CallEyeImageQualityCheckModel);
        const messageFromModel =
        await EyeImgQultyModel.getEyeImageQualityCheckModelResponse(eventObj.body.queryResult.queryText,eventObj);
        await sendExtraMessagesobj.sendExtraMessage(eventObj, intent, messageFromModel);
        const repetitionFlag = await kerotoplastyServiceObj.postingImage(eventObj);
        if (repetitionFlag !== "True"){
            const inputMessage = `Would you like to request an appointment?`;
            const yesIntentName = "BookAppointment";
            const noIntentName = "responseNo";
            sendExtraMessagesobj.sendSecondaryButtonMessage(inputMessage, yesIntentName, noIntentName,  eventObj);
        }
    } catch (error) {
        console.log(error);
    }
}



