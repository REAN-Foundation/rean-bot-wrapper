import { SelectBloodGroupService } from "../../../services/bloodWrrior/select.blood.group.service";

export const SelectBloodGroupListener = async (intent, eventObj) => {
    const selectBloodGroupService: SelectBloodGroupService = eventObj.container.resolve(SelectBloodGroupService);
    return new Promise(async (resolve) => {
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
