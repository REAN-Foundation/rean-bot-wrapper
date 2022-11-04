import { RaiseDonationRequestService } from "../../../services/bloodWrrior/raise.request.service";

const raiseDonationRequestService = new RaiseDonationRequestService();

export const RaiseBloodDonationRequest = async (intent, eventObj) => {
    return new Promise(async (resolve) => {
        try {
            let response = null;
            response = await raiseDonationRequestService.sendUserMessage(eventObj);
            resolve(response.message);

            response = await raiseDonationRequestService.raiseBloodDonation(eventObj,
                response.patientUserId,response.name);
            if (response.result.statusCode === 200 ) {
                console.log(`Succesfully donation request send to donor. DonorName : ${response.name}.`);
            }
            else {
                console.log(`Cannot send donation request to donor`);
            }

        } catch (error) {
            console.log(error);
        }
    });
};
