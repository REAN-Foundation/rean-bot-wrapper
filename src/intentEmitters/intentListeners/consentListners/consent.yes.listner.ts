import { ConsentService } from "../../../services/consent.service";

export class ConsentYesListner {

    public static handleIntent = async (intent, eventObj) => {
        try {

            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            console.log(userId);
            const consentService: ConsentService = eventObj.container.resolve(ConsentService);
            const response = await consentService.handleConsentYesreply(userId);
            return response;

        }
        catch (error) {
            throw new Error(`Handle add medication intent ${error}`);
        }

    };

}

