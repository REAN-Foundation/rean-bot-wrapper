import { VolunteerService } from "../../../services/bloodWrrior/volunteer.service";

export const BloodWarriorVolunteer = async (intent, eventObj) => {
    const volunteerService: VolunteerService = eventObj.container.resolve(VolunteerService);
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await volunteerService.volunteerService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
