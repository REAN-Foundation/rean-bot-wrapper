import { Logger } from '../../common/logger';
import { Loader } from '../../startup/loader';
import { InitiateDeleteReminderService } from '../../services/reminder/initiate.delete.reminder.service';
export const InitiateDeleteReminderListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Initiate Delete Reminder received!!!!!');

        let response = null;
        eventObj.container = Loader.container;
        const deleteReminderService = eventObj.container.resolve(InitiateDeleteReminderService);
        response = await deleteReminderService.initiateDelete(eventObj);

        // console.log('Inside listener: ', response);
        if (!response) {

            // console.log('Initiate Delete Reminder failed');
            throw new Error("Initiate Delete Reminder service failed");
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Initiate Delete Reminder Error!');
        throw new Error("Initiate Delete Reminder error");
    }
};

export const GetReminderDetails = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Get Delete Reminder Details received!!!!!');

        let response = null;
        const deleteReminderService = eventObj.container.resolve(InitiateDeleteReminderService);
        response = await deleteReminderService.getReminderDetails(eventObj);

        // console.log('Inside listener: ', response);
        if (!response) {

            // console.log('Get Delete Reminder Details');
            throw new Error("Get Delete Reminder Details failed");
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Get Delete Reminder Details Error!');
        throw new Error("Get Delete Reminder Details error");
    }
};

export const DeleteReminder = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Delete Reminder received!!!!!');

        let response = null;
        const deleteReminderService = eventObj.container.resolve(InitiateDeleteReminderService);
        response = await deleteReminderService.deleteRemider(eventObj);

        // console.log('Inside listener: ', response);
        if (!response) {

            // console.log('Delete Reminder');
            throw new Error("Delete Reminder failed");
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Delete Reminder Error!');
        throw new Error("Delete Reminder error");
    }
};
