import { BloodWarriorWelcomeService } from "../../../services/bloodWrrior/welcome.service";

export const BloodWarriorWelcome = async (intent, eventObj) => {
    const welcomeService: BloodWarriorWelcomeService = eventObj.container.resolve(BloodWarriorWelcomeService);
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
