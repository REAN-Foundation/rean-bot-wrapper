import { VolunteerService } from "../../../services/bloodWrrior/volunteer.service";
const volunteerService: VolunteerService  = new VolunteerService;

export const BloodWarriorVolunteer = async (intent, eventObj) => {
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
