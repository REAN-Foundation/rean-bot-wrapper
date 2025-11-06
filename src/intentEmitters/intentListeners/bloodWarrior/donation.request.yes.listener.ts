import { DonationRequestYesService } from "../../../services/bloodWrrior/donation.request.yes.service.js";

export const DonationRequestYesListener = async (intent, eventObj) => {
    const donationRequestYesService: DonationRequestYesService = eventObj.container.resolve(DonationRequestYesService);
    try {
        let result = null;
        result = await donationRequestYesService.sendUserMessage(eventObj);
        const patientUserId = result.patientUserId;
        sendRequestToDonor(patientUserId);
        return result.message;
    } catch (error) {
        console.log(error);
    }

    async function sendRequestToDonor(patientUserId: any) {
        await donationRequestYesService.raiseDonorRequest(eventObj,
            patientUserId)
            .then((result) => {
                donationRequestYesService.notifyVolunteer(
                    eventObj, patientUserId, result.donorNames);
            });
    }
};
