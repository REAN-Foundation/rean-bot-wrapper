import { BloodWarriorMenuService } from "../../../services/bloodWrrior/menu.service";

export const BloodWarriorMenu = async (intent, eventObj) => {
    const bloodWarriorMenuService: BloodWarriorMenuService = eventObj.container.resolve(BloodWarriorMenuService);
    return new Promise(async (resolve) => {
        try {
            const result = await bloodWarriorMenuService.menuService(eventObj);
            console.log(result);
            resolve(result);

        } catch (error) {
            console.log(error);
        }
    });
};
