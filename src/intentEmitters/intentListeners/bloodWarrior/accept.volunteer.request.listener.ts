import { AcceptVolunteerRequestService } from "../../../services/bloodWrrior/accept.volunteer.request.service";

export const AcceptVolunteerRequestListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const acceptVolunteerRequestService: AcceptVolunteerRequestService = eventObj.container.resolve(AcceptVolunteerRequestService);
    return new Promise(async (resolve) => {
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
