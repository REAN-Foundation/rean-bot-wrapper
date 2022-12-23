import { AcceptVolunteerRequestService } from "../../../services/bloodWrrior/accept.volunteer.request.service";
const acceptVolunteerRequestService: AcceptVolunteerRequestService = new AcceptVolunteerRequestService();

export const AcceptVolunteerRequestListener = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await acceptVolunteerRequestService.sendUserMessage(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
