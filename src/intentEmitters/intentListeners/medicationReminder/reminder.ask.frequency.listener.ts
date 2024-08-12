import { ReminderFrequencyService } from "../../../services/reminder/reminder.ask.frequency.service";
import { MedicationStoppedReasonService } from "../../../services/reminder/medication.not.taken.followup.service"

export const ReminderFrequencyListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const reminderAskFrequency: ReminderFrequencyService = eventObj.container.resolve(ReminderFrequencyService);
    try {
        let result = null;
        const intentName = eventObj.body.queryResult ? eventObj.body.queryResult.intent.displayName : null;
        const frequency = getFrequencyFromIntentName(intentName);
        result = await reminderAskFrequency.createReminder(eventObj, frequency);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};

export const SendFrequencyButtonsListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const reminderAskFrequency: ReminderFrequencyService = eventObj.container.resolve(ReminderFrequencyService);
    try {
        let result = null;
        result = await reminderAskFrequency.sendFrequencyButtons(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};

export const StopMedicationReasonListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const medicationStoppedReason: MedicationStoppedReasonService = eventObj.container.resolve(MedicationStoppedReasonService);
    try {
        let result = null;
        result = await medicationStoppedReason.medicationStoppedReasonButtons(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};

const getFrequencyFromIntentName = (IntentName) => {
    const message = {
        "Reminder_Frequency_Once"   : "Once",
        "Reminder_Frequency_Daily"  : "Daily",
        "Reminder_Frequency_Weekly" : "Weekly",
    };
    return message[IntentName] ?? "Once";
};
