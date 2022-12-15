import { container } from "tsyringe";
import { kerotoplastyService } from "../../services/kerotoplasty.service";


export const kerotoplastyLocationListener = async (intent:string, eventObj) => {
    const kerotoplastyServiceObj: kerotoplastyService = container.resolve(kerotoplastyService);
    return new Promise(async (resolve,reject) => {
        const location_response = await kerotoplastyServiceObj.conditionSpecificResponse(intent,eventObj);
        resolve(location_response);
        const postResponse = await kerotoplastyServiceObj.postImageOnClickup(intent,eventObj);
    });
};