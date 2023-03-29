import { BloodWarriorWelcomeService } from "../../../services/bloodWrrior/welcome.service";

export const BloodWarriorPatient = async (intent, eventObj) => {
    const welcomeService: BloodWarriorWelcomeService = eventObj.container.resolve(BloodWarriorWelcomeService);
    try {
        let result = null;
        result = await welcomeService.patientService(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
