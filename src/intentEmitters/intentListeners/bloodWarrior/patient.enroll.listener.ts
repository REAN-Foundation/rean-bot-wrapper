import { EnrollPatientService } from "../../../services/bloodWrrior/enroll.service";

export const BloodWarriorPatientEnroll = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            const enrollPatientService = eventObj.container.resolve(EnrollPatientService);
            result = await enrollPatientService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
