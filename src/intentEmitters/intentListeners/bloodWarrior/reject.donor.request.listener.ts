import { RejectDonorRequestService } from "../../../services/bloodWrrior/reject.donor.request.js";

export const RejectDonorRequest = async (intent, eventObj) => {
    const rejectDonorRequestService: RejectDonorRequestService = eventObj.container.resolve(RejectDonorRequestService);
    try {
        let result = null;
        result = await rejectDonorRequestService.rejectDonorRequest(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
