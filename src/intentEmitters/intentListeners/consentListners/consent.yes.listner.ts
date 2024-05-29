import { ConsentService } from "../../../services/consent.service";

export class ConsentYesListner {

    public static handleIntent = async (intent, eventObj) => {
        try {

            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const userName = eventObj.body.originalDetectIntentRequest.payload.userName;
            console.log(userId);
            const consentService: ConsentService = eventObj.container.resolve(ConsentService);
            consentService.handleConsentYesreply(userId,userName, eventObj);
            const response = null;
            return response;

        }
        catch (error) {
            throw new Error(`Handle add medication intent ${error}`);
        }

    };

}

