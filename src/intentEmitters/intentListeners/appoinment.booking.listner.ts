import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { Logger } from "../../common/logger";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";
import { translateService } from "../../services/translate.service";
import { sendExtraMessages } from "../../services/send.extra.messages.service";
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';


export const AppointmentBookingListner= async ( intent, eventObj ) => {
    const dialoflowMessageFormattingObj: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
    const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
    const clientEnvironmentProviderServiceObj: ClientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);

    try {
        
        console.log("Appointment booking listener is here");
        const customAppointmentSetting: boolean = clientEnvironmentProviderServiceObj.getClientEnvironmentVariable("CLK_FLAG") === "true";
        const parameters = eventObj.body.queryResult.parameters;
        let response = null;
        let message = "Thank you for your response. Someone from our side will contact you soon.";
        if (Object.keys(parameters).length > 0){
            const date_time = eventObj.body.queryResult.parameters.Date.date_time;
            const date = new Date(date_time).toDateString();
            const time = (new Date(date_time).toTimeString()).split('G')[0];
            message = `Your request to schedule an appointment on *${date}* at  ${time}, has been sent.\n We will get back to you with a confirmation. \n \n *Disclaimer :* Please note, we might not be able to accommodate your requested time.`;
            if (parameters.Location) {
                const location = eventObj.body.queryResult.parameters.Location;
                const doctor = eventObj.body.queryResult.parameters.Doctor.name;
                message = `Your request to schedule an appointment with *${doctor}* at *${location}* on *${date}* at  ${time}, has been sent.\n We will get back to you with a confirmation. *You can call at 080-66202020 for more information*\n \n *Disclaimer :* Please note, we may not be able to accommodate your requested time.`;
            }
        }
        response = await dialoflowMessageFormattingObj.making_response(message);
        kerotoplastyServiceObj.UpdatingAppointmentOnClickup(intent, eventObj);
        if (!customAppointmentSetting){
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
