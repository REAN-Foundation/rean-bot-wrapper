import { getAdditionalInfoSevice } from "../../../services/get.additional.info.service";
import {dialoflowMessageFormatting} from "../../../services/Dialogflow.service";

export const AdditionalInfoEditListener = async (intent:string, eventObj) => {
    // eslint-disable-next-line max-len
    const InfoService: getAdditionalInfoSevice = eventObj.container.resolve(getAdditionalInfoSevice);
    const dialoflowMessageFormattingObj: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
    const message = "We are processing your request. Please wait for a while.";
    const response = await dialoflowMessageFormattingObj.making_response(message);
    InfoService.processAdditionalInfo(eventObj);
    return  response;

};

