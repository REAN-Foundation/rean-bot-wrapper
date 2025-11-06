import { RaiseDonationRequestNoService } from "../../../services/bloodWrrior/raise.request.no.service.js";

export const RaiseRequestNoNotifyVolunteer = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const raiseDonationRequestNoService: RaiseDonationRequestNoService = eventObj.container.resolve(RaiseDonationRequestNoService);
    try {
        let response = null;
        response = await raiseDonationRequestNoService.sendRejectionMessage(eventObj);
        const patientUserId = response.patientUserId;
        const patientName = response.name;
        await notifyVolunteer(patientUserId, patientName, response.transfusionDate);
        return response.message;
    } catch (error) {
        console.log(error);
    }

    async function notifyVolunteer(patientUserId: any, patientName: any, transfusionDate: string) {
        await raiseDonationRequestNoService.patientRejectionNotifyVolunteer(eventObj,
            patientUserId, patientName, transfusionDate);
    }
};
