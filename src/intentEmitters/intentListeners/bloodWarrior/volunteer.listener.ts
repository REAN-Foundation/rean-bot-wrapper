import { VolunteerService } from "../../../services/bloodWrrior/volunteer.service";

export const BloodWarriorVolunteer = async (intent, eventObj) => {
    const volunteerService: VolunteerService = eventObj.container.resolve(VolunteerService);
    try {
        let result = null;
        result = await volunteerService.volunteerService(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
