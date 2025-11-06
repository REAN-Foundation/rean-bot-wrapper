import { NeedBloodService } from "../../../services/bloodWrrior/need.blood.service.js";

export const NeedBloodPatientYesListener = async (intent, eventObj) => {
    const needBloodService: NeedBloodService = eventObj.container.resolve(NeedBloodService);
    try {
        const result = await needBloodService.needBloodPatientService(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
