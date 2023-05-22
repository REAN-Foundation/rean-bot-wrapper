import { FeelingUnwellService } from "../../../services/bloodWrrior/feeling.unwell.notify.volunteer.service";

export const FeelingUnwellNotifyVolunteer = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const feelingUnwellService: FeelingUnwellService = eventObj.container.resolve(FeelingUnwellService);
    try {
        let response = null;
        response = await feelingUnwellService.sendMeassageToPatient(eventObj);
        const patientUserId = response.patientUserId;
        const patientName = response.name;
        notifyVolunteer(patientUserId, patientName, response.transfusionDate);
        return response.message;
    } catch (error) {
        console.log(error);
    }

    function notifyVolunteer(patientUserId: any, patientName: any, transfusionDate: string) {
        feelingUnwellService.notifyVolunteer(eventObj,
            patientUserId, patientName, transfusionDate);
    }
};
