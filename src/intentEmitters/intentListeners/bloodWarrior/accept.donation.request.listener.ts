import { AcceptDonationRequestService } from "../../../services/bloodWrrior/accept.donation.request.service";

export const AcceptDonationRequestListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const acceptDonationRequestService: AcceptDonationRequestService = eventObj.container.resolve(AcceptDonationRequestService);
    return new Promise(async (resolve) => {
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
