import { getAdditionalInfoSevice } from "../../../services/get.additional.info.service";
export const AdditionalInfoReadListener = async (intent, eventObj) => {

    try {
        
        const InfoService: getAdditionalInfoSevice = eventObj.container.resolve(getAdditionalInfoSevice);
        const response = await InfoService.readEHR(eventObj );
        return response;
    } catch (error) {
        console.log(error);
    }

};
