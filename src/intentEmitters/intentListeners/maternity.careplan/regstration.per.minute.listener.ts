import { RegistrationPerMinMsgService } from "../../../services/maternalCareplan/registration.per.minute.sercice.js";

export const  RegistrationPerMinuteMsgListener = async (_intent, eventObj) => {
    try {
        const registerService: RegistrationPerMinMsgService = eventObj.container.resolve(RegistrationPerMinMsgService);
        const response = await registerService.registrationService(eventObj);
        return response;
    } catch (error) {
        throw new Error(`Handle maternity careplan intent ${error}`);
    }

};

