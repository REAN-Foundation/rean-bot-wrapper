import { getAdditionalInfoSevice } from "../../../services/get.additional.info.service";
import { dialoflowMessageFormatting } from "../../../services/Dialogflow.service";
export const AdditionalInfoReadListener = async (intent, eventObj) => {

    const dialoflowMessageFormattingObj: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
    try {
        
        const InfoService: getAdditionalInfoSevice = eventObj.container.resolve(getAdditionalInfoSevice);
        const response = await InfoService.readEHR(eventObj );
        return response;
    } catch (error) {
        console.log(error);
    }

};
