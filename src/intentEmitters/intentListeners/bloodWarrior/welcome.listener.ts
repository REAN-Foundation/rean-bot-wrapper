import { BloodWarriorWelcomeService } from "../../../services/bloodWrrior/welcome.service";

export const BloodWarriorWelcome = async (intent, eventObj) => {
    const welcomeService: BloodWarriorWelcomeService = eventObj.container.resolve(BloodWarriorWelcomeService);
    try {
        const result = await welcomeService.registrationService(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};
