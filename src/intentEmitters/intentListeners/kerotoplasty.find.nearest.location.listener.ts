import { container } from "tsyringe";
import { kerotoplastyService } from "../../services/kerotoplasty.service";

export const kerotoplastyLocationListener = async (intent:string, eventObj) => {
    const kerotoplastyServiceObj: kerotoplastyService = container.resolve(kerotoplastyService);
    return new Promise(async (resolve) => {
        const location_response = await kerotoplastyServiceObj.conditionSpecificResponse(intent,eventObj);
        resolve(location_response);
    });
};
