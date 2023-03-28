import { RejectDonorRequestService } from "../../../services/bloodWrrior/reject.donor.request";

export const RejectDonorRequest = async (intent, eventObj) => {
    const rejectDonorRequestService: RejectDonorRequestService = eventObj.container.resolve(RejectDonorRequestService);
    return new Promise(async (resolve) => {
        try {
            let result = null;
            result = await rejectDonorRequestService.rejectDonorRequest(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
