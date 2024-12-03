import { GeneralReminderService } from "../../../services/reminder/general.reminder.service";
import { NeedleService } from '../../../services/needle.service';
import { Loader } from '../../../startup/loader';

export const SetReminderListener = async (intent, eventObj) => {
    eventObj.container = Loader.container;
    // eslint-disable-next-line max-len
    const generalReminderService: GeneralReminderService = eventObj.container.resolve(GeneralReminderService);
    try {
        let result = null;
        result = await generalReminderService.createReminderN(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};
