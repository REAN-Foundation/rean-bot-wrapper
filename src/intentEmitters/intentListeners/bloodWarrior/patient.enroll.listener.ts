import { enrollPatientService } from "../../../services/bloodWrrior/enroll.service";

export const BloodWarriorPatientEnroll = async (intent, eventObj) => {
    return new Promise(async (resolve) => {
        try {
            let result = null;
            result = await enrollPatientService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
