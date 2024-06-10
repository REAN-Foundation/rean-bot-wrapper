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
            const date_time = eventObj.body.queryResult.parameters.Date.date_time;
            const date = new Date(date_time).toDateString();
            const time = (new Date(date_time).toTimeString()).split('G')[0];

            const location = eventObj.body.queryResult.parameters.Location;
            const doctor = eventObj.body.queryResult.parameters.Doctor.name;
            
            const message = `Your request to schedule an appointment with *${doctor}* at *${location}* on *${date}* at  ${time}, has been sent.\n We will get back to you with a confirmation. *You can call at 080-66202020 for more information*\n \n *Disclaimer :* Please note, we may not be able to accommodate your requested time.`;
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

