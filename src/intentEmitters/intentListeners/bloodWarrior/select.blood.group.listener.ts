import { SelectBloodGroupService } from "../../../services/bloodWrrior/select.blood.group.service.js";

export const SelectBloodGroupListener = async (intent, eventObj) => {
    const selectBloodGroupService: SelectBloodGroupService = eventObj.container.resolve(SelectBloodGroupService);
    try {
        let result = null;
        result = await selectBloodGroupService.bloodGroupService(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
