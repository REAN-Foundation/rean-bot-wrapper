import { DonationRequestYesService } from "../../../services/bloodWrrior/donation.request.yes.service";

export const DonationRequestYesListener = async (intent, eventObj, resolve, reject) => {
    const donationRequestYesService: DonationRequestYesService = eventObj.container.resolve(DonationRequestYesService);
    // return new Promise(async (resolve) => {
    try {
        let result = null;
        result = await donationRequestYesService.sendUserMessage(eventObj);
        const patientUserId = result.patientUserId;
        resolve(result.message);

        await donationRequestYesService.raiseDonorRequest(eventObj,
            patientUserId )
            .then((result) => { donationRequestYesService.notifyVolunteer(
                eventObj, patientUserId, result.donorNames); });

    } catch (error) {
        console.log(error);
    }
    // });
};
