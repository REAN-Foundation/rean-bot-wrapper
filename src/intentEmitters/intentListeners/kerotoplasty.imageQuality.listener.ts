import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";
import { getAdditionalInfoSevice } from "../../services/get.additional.info.service";
import { translateService } from "../../services/translate.service";
import { CallEyeImageQualityCheckModel } from '../../services/call.eye.image.quality.check';
import { NeedleService } from "../../services/needle.service";

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
        const EyeImgQultyModel: CallEyeImageQualityCheckModel =
         eventObj.container.resolve(CallEyeImageQualityCheckModel);
        const messageFromModel =
        await EyeImgQultyModel.getEyeImageQualityCheckModelResponse(eventObj.body.queryResult.queryText,eventObj);
        await kerotoplastyServiceObj.sendExtraMessage(eventObj, intent, messageFromModel);
        const repetitionFlag = await kerotoplastyServiceObj.postingImage(eventObj);
        if (repetitionFlag !== "True"){
            keratoplastyNextSteps(eventObj);
        }
    } catch (error) {
        console.log(error);
    }
}


async function keratoplastyNextSteps(eventObj) {
    try {
        console.log("STEP 4");
        let message = `Would you like to request an appointment?`;
        const additionalObj: getAdditionalInfoSevice = eventObj.container.resolve(getAdditionalInfoSevice);
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const languageCode = eventObj.body.queryResult.languageCode;
        const translationServiceObj: translateService = eventObj.container.resolve( translateService);
        const button_yes = await translationServiceObj.translatestring("Yes",languageCode);
        const button_no = await translationServiceObj.translatestring("No",languageCode);
        message  = await translationServiceObj.translatestring(message,languageCode);
        const buttonArray = [button_yes, "BookAppointment",button_no,"responseNo"];
        additionalObj.sendResponsebyButton( message,eventObj, userId,buttonArray);

    } catch (error) {
        console.log(error);
        throw new Error("Keratoplasty next steps error");
    }
}
