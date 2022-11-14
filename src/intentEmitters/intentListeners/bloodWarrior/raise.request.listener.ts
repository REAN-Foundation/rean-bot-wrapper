import { RaiseDonationRequestService } from "../../../services/bloodWrrior/raise.request.service";

const raiseDonationRequestService = new RaiseDonationRequestService();

export const RaiseBloodDonationRequest = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let response = null;
            response = await raiseDonationRequestService.sendUserMessage(eventObj);
            const patientUserId = response.patientUserId;
            const patientName = response.name;
            resolve(response.message);

            await raiseDonationRequestService.raiseBloodDonation(eventObj,
                patientUserId, patientName)
                .then((result) => { raiseDonationRequestService.notifyVolunteer(
                    eventObj, patientUserId, patientName, result.stringTFDate, result.donorNames); });
        } catch (error) {
            console.log(error);
        }
    });
};
