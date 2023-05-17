import { RaiseDonationRequestService } from "../../../services/bloodWrrior/raise.request.service";

export const RaiseRequestNoNotifyVolunteer = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const raiseDonationRequestService: RaiseDonationRequestService = eventObj.container.resolve(RaiseDonationRequestService);
    try {
        let response = null;
        response = await raiseDonationRequestService.sendRejectionMessage(eventObj);
        const patientUserId = response.patientUserId;
        const patientName = response.name;
        notifyVolunteer(patientUserId, patientName, response.transfusionDate);
        return response.message;
    } catch (error) {
        console.log(error);
    }

    async function notifyVolunteer(patientUserId: any, patientName: any, transfusionDate: string) {
        await raiseDonationRequestService.patientRejectionNotifyVolunteer(eventObj,
            patientUserId, patientName, transfusionDate);
    }
};
