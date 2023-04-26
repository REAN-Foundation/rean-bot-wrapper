import { Logger } from "../../common/logger";
import { eyeSymptoms } from "../../services/eye.symptoms.service";

export const eyeSymptomAssessment = async ( intent,eventObj ) => {
    try {
        Logger.instance()
            .log("Eye Symptom Assessment");
        
        console.log(intent);
        const response = await eyeSymptoms(eventObj,intent);
        return response;
    } catch (error) {
        Logger.instance()
            .log_error(error.message,500,'Eye Symptom listener error');
        throw new Error("Eye symptom listener error");
    }
};