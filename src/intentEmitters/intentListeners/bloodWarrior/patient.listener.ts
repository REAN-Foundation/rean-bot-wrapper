import { BloodWarriorWelcomeService } from "../../../services/bloodWrrior/welcome.service";

export const BloodWarriorPatient = async (intent, eventObj) => {
    const welcomeService: BloodWarriorWelcomeService = eventObj.container.resolve(BloodWarriorWelcomeService);
    return new Promise(async (resolve) => {
        try {
            let result = null;
            result = await welcomeService.patientService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
