import { EventMessage, UserDeleteEvent } from "../domain.types/event.types";
import { Logger } from "./logger";

export class EventHandler {

    static async handleUserDeletion(event: EventMessage) {
        try {
            const payload: UserDeleteEvent = event.Payload as UserDeleteEvent;
            Logger.instance().log('User deletion event received: ' + JSON.stringify(event));
            if (!payload?.PatientUserId) {
                Logger.instance().log('Patient user id is required for user deletion event');
                return;
            }
            if (payload?.PatientUserId) {

                //TODO: Implement user deletion service
                
                // await EventHandler._userDeleteService.delete(
                //     payload?.PatientUserId,
                //     payload?.TenantId,
                //     payload?.TenantName
                // );
            }
            
        } catch (error) {
            Logger.instance().log('Error handling user deletion event: ' + error.message);
        }
    }

}
