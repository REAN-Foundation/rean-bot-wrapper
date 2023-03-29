import { RaiseDonationRequestService } from "../../../services/bloodWrrior/raise.request.service";

export const RaiseBloodDonationRequest = async (intent, eventObj, resolve, reject) => {
    // eslint-disable-next-line max-len
    const raiseDonationRequestService: RaiseDonationRequestService = eventObj.container.resolve(RaiseDonationRequestService);
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
};
