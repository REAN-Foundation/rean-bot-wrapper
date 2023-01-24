import { AcceptDonationRequestService } from "../../../services/bloodWrrior/accept.donation.request.service";
const acceptDonationRequestService: AcceptDonationRequestService = new AcceptDonationRequestService();

export const AcceptDonationRequestListener = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await acceptDonationRequestService.sendUserMessage(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
