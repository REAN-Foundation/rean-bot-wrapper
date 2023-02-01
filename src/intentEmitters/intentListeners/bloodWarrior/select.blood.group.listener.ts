import { SelectBloodGroupService } from "../../../services/bloodWrrior/select.blood.group.service";

const selectBloodGroupService : SelectBloodGroupService = new SelectBloodGroupService();

export const SelectBloodGroupListener = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await selectBloodGroupService.bloodGroupService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
