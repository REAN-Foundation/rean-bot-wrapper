import { BloodWarriorWelcomeService } from "../../../services/bloodWrrior/welcome.service";
import { container } from "tsyringe";
const welcomeService: BloodWarriorWelcomeService = container.resolve(BloodWarriorWelcomeService);

export const BloodWarriorPatient = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
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
