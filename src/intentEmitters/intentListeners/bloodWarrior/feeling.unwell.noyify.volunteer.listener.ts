import { FeelingUnwellService } from "../../../services/bloodWrrior/feeling.unwell.notify.volunteer.service";

export const FeelingUnwellNotifyVolunteer = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const feelingUnwellService: FeelingUnwellService = eventObj.container.resolve(FeelingUnwellService);
    try {
        let response = null;
        response = await feelingUnwellService.sendMeassageToPatient(eventObj);
        const patientUserId = response.patientUserId;
        const patientName = response.name;
        await notifyVolunteer(patientUserId, patientName, response.transfusionDate);
        return response.message;
    } catch (error) {
        console.log(error);
    }

    async function notifyVolunteer(patientUserId: any, patientName: any, transfusionDate: string) {
        await feelingUnwellService.notifyVolunteer(eventObj,
            patientUserId, patientName, transfusionDate);
    }
};
