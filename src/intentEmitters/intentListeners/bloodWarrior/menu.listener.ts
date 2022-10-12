import { BloodWarriorMenuService } from "../../../services/bloodWrrior/menu.service";
import { container } from "tsyringe";

const bloodWarriorMenuService: BloodWarriorMenuService = container.resolve(BloodWarriorMenuService);

export const BloodWarriorMenu = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            const result = await bloodWarriorMenuService.menuService(eventObj);
            console.log(result);
            resolve(result);

        } catch (error) {
            console.log(error);
        }
    });
};
