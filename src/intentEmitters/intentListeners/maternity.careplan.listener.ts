import { RegistrationService } from "../../services/maternalCareplan/registration.service.js";

export class MaternityCareplanListener {

    public static handleIntent = async (_intent, eventObj) => {
        const _registrationService:  RegistrationService = eventObj.container.resolve(RegistrationService);
        try {

            const response  = await _registrationService.registrationService(eventObj);

            if (!response) {
                throw new Error('Maternity careplan registration service error!');

            }

            return response;
        } catch (error) {
            throw new Error(`Handle maternity careplan intent ${error}`);
        }

    };

    // public static handleEnrollIntent = async (_intent, eventObj) => {
    //     const _enrollService:  EnrollService = eventObj.container.resolve(EnrollService);
    //     try {

    //         const response = await _enrollService.enrollService(eventObj);

    //         if (!response) {
    //             throw new Error('Maternity careplan enrollment service error!');

    //         }

    //         return response.message;
    //     } catch (error) {
    //         throw new Error(`Handle maternity careplan enrollment intent error: ${error}`);
    //     }

    // };

}

export interface Response {
    message: any;
}
