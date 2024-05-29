import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { Logger } from "../../common/logger";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";

export const AppoinmentBookingListner= async ( intent, eventObj ) => {
    const dialoflowMessageFormattingObj: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
    const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);

    try {
        console.log("Appointment booking listener is here");
        let response = null;
        if (eventObj.body.queryResult.parameters.Assessment === "Yes"){
            response = await dialoflowMessageFormattingObj.triggerIntent("conditionIdentification", eventObj );
        }
        else {
            const message = "The request for scheduling an appointment has been sent. We will get back to you with confirmation.\n We may not be able to give you appoinment at your requested time";
            response = await dialoflowMessageFormattingObj.making_response(message);
        }
        kerotoplastyServiceObj.UpdatingAppointmentOnClickup(intent,eventObj);
        
        return response;
    } catch (error) {
        Logger.instance()
            .log_error(error.message,500,'Food info listener error');
        throw new Error("Food info listener error");
    }
};

