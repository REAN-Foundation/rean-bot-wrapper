import { RegistrationService } from "../../services/maternalCareplan/registration.service";
import { EnrollService } from "../../services/maternalCareplan/enroll.service";

export class MaternityCareplanListener {

    public static handleIntent = async (_intent, eventObj) => {
        try {
            const registrationService = eventObj.container.resolve(RegistrationService);
            const response = await registrationService(eventObj);

            if (!response) {
                throw new Error('Maternity careplan registration service error!');
                
            }
            
            return response.message;
        } catch (error) {
            throw new Error(`Handle maternity careplan intent ${error}`);
        }

    };

    public static handleEnrollIntent = async (_intent, eventObj) => {
        try {

            const enrollService = eventObj.container.resolve(EnrollService);
            const response = await enrollService(eventObj);

            if (!response) {
                throw new Error('Maternity careplan enrollment service error!');
                
            }
            
            return response.message;
        } catch (error) {
            throw new Error(`Handle maternity careplan enrollment intent error: ${error}`);
        }

    };

}
