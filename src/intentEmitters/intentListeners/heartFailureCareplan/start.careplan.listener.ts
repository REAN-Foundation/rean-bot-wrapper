import { HeartFailureRegistrationService } from "../../../services/heartFailureCareplan/enroll.heart.failure.careplan.service";
import { HeartFailureCareplanService } from "../../../services/heartFailureCareplan/start.careplan";

export const  SentRegistrationMSGListener = async ( intent, eventObj) => {
    try {
        const careplanService: HeartFailureCareplanService = eventObj.container.resolve(HeartFailureCareplanService);
        const response = await careplanService.sendRegistrationMsg(eventObj);
        return response;
    } catch (error) {
        throw new Error(`Send heart registration msg careplan intent ${error}`);
    }

};

export const EnrollHFCareplanListener = async ( intent, eventObj) => {
    try {
        const enrollService: HeartFailureRegistrationService =
            eventObj.container.resolve(HeartFailureRegistrationService);
        const response = await enrollService.registrationService(eventObj);
        return response;
    } catch (error) {
        throw new Error(`Handle heart failure careplan intent ${error}`);
    }

};

