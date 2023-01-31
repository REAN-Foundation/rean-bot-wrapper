import { RejectDonorRequestService } from "../../../services/bloodWrrior/reject.donor.request";

const rejectDonorRequestService: RejectDonorRequestService  = new RejectDonorRequestService;

export const RejectDonorRequest = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
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
