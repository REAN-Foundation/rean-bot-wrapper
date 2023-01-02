import { DonationRequestYesService } from "../../../services/bloodWrrior/donation.request.yes.service";
const donationRequestYesService: DonationRequestYesService  = new DonationRequestYesService;

export const DonationRequestYesListener = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
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
    });
};
