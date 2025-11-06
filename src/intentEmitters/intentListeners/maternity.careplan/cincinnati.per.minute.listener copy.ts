import { CincinnatiPerMinMsgService } from "../../../services/maternalCareplan/cincannati.demo.js";

export const  CincinnatiPerMinuteMsgListener = async (_intent, eventObj) => {
    try {
        const cincinattiPerMinService: CincinnatiPerMinMsgService = eventObj.container.resolve(CincinnatiPerMinMsgService);
        const response = await cincinattiPerMinService.registrationService(eventObj);
        return response;
    } catch (error) {
        throw new Error(`Handle cincinatti intent ${error}`);
    }

};

