import { AcceptVolunteerRequestService } from "../../../services/bloodWrrior/accept.volunteer.request.service.js";

export const AcceptVolunteerRequestListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const acceptVolunteerRequestService: AcceptVolunteerRequestService = eventObj.container.resolve(AcceptVolunteerRequestService);
    try {
        let result = null;
        result = await acceptVolunteerRequestService.sendUserMessage(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
