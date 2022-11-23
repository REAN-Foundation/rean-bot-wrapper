import { BloodWarriorWelcomeService } from "../../../services/bloodWrrior/welcome.service";
import { container } from "tsyringe";
const welcomeService: BloodWarriorWelcomeService = container.resolve(BloodWarriorWelcomeService);

export const BloodWarriorWelcome = async (intent, eventObj) => {
    return new Promise(async (resolve) => {
        try {
            const result = await welcomeService.registrationService(eventObj);
            console.log(result);
            resolve(result);

        } catch (error) {
            console.log(error);
        }
    });
};
