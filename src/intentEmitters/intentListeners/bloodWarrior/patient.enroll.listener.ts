import { EnrollPatientService } from "../../../services/bloodWrrior/enroll.service";

export const BloodWarriorPatientEnroll = async (intent, eventObj) => {
    return new Promise(async (resolve) => {
        const enrollPatient = eventObj.container.resolve(EnrollPatientService);
        try {
            let result = null;
            result = await enrollPatient.enrollPatientService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
