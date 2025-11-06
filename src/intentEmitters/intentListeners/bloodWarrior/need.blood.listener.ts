import { NeedBloodService } from "../../../services/bloodWrrior/need.blood.service.js";

export const NeedBloodListener = async (intent, eventObj) => {
    const needBloodService: NeedBloodService = eventObj.container.resolve(NeedBloodService);
    try {
        const result = await needBloodService.triggerNeedBloodEvent(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};
