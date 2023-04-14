import { BloodWarriorMenuService } from "../../../services/bloodWrrior/menu.service";

export const BloodWarriorMenu = async (intent, eventObj) => {
    const bloodWarriorMenuService: BloodWarriorMenuService = eventObj.container.resolve(BloodWarriorMenuService);
    try {
        const result = await bloodWarriorMenuService.menuService(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};
