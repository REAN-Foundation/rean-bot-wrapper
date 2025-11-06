import { kerotoplastyService } from "../../services/kerotoplasty.service.js";
import { Logger } from "../../common/logger.js";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service.js";
import { translateService } from "../../services/translate.service.js";
import { sendExtraMessages } from "../../services/send.extra.messages.service.js";
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service.js';

export const AppointmentBookingListner = async ( intent, eventObj ) => {
    const dialoflowMessageFormattingObj: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
    const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
    const clientEnvironmentProviderServiceObj: ClientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);

    try {
        console.log("Appointment booking listener is here");
        const customRemSetting: boolean = await clientEnvironmentProviderServiceObj.getClientEnvironmentVariable("CUSTOM_REM_SETTING") === "true";
        let response = null;
        const parameters =  eventObj.body.queryResult.parameters;
        const date_time = eventObj.body.queryResult.parameters.Date.date_time;
        const date = new Date(date_time).toDateString();
        const time = (new Date(date_time).toTimeString())
            .split('G')[0];
        let message = `Your appointment request for *${date}* at * ${time} * has been received.`;
        const hasDoctorParam = 'Doctor' in parameters;
        const hasLocationParam = 'Location' in parameters;
        if (!hasDoctorParam && !hasLocationParam) {
            message += `\nWe will get back to you shortly with a confirmation.`;
        } else {
            const location = parameters.Location;
            const doctor = parameters.Doctor.name;
            if (doctor) {
                message += `\nDoctor: *${doctor}*`;
            }
            if (location) {
                message += `\nLocation: *${location}*`;
            }
            message += `\n\nWe will get back to you shortly with a confirmation.` +
            `\nFor any queries or immediate assistance, feel free to call us at *080-66202020*.` +
            `\n\n*Disclaimer:* While we’ll do our best to accommodate your preferred time, it may not always be possible due to scheduling constraints.`;
        }
        response = await dialoflowMessageFormattingObj.making_response(message);
        kerotoplastyServiceObj.UpdatingAppointmentOnClickup(intent, eventObj);
        if (!customRemSetting) {
            const repetitionFlag  = await kerotoplastyServiceObj.CheckRepetitionFlag(eventObj);
            if (repetitionFlag !== "False"){
                keratoplastyNextSteps(intent,eventObj);
            }
        }
        return response;
    } catch (error) {
        Logger.instance()
            .log_error(error.message,500,'Food info listener error');
        throw new Error("Food info listener error");
    }
};
async function keratoplastyNextSteps(intent,eventObj) {
    try {
        console.log("STEP 4");
        let message = "Do you have any *symptoms* in your operated eye that you would like to discuss with your doctor?";
        const sendExtraMessagesobj: sendExtraMessages = eventObj.container.resolve(sendExtraMessages);
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const languageCode = eventObj.body.queryResult.languageCode;
        const translationServiceObj: translateService = eventObj.container.resolve( translateService);
        message  = await translationServiceObj.translatestring(message,languageCode);
        const button_yes = await translationServiceObj.translatestring("Yes",languageCode);
        const button_no = await translationServiceObj.translatestring("No",languageCode);
        const buttonArray = [button_yes, "afConditionIdentification",button_no,"responseNo"];
        sendExtraMessagesobj.sendResponsebyButton(message,eventObj, userId,buttonArray);
    } catch (error) {
        console.log(error);
        throw new Error("Keratoplasty appointment next steps error");
    }
}
