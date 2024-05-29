import { GetLocation } from "../.././services/find.nearest.location.service";
import {dialoflowMessageFormatting} from "../.././services/Dialogflow.service";

export const NearestLocationListner = async (intent:string, eventObj) => {
    const  LocationService:  GetLocation = eventObj.container.resolve( GetLocation);
    const dialoflowMessageFormattingObj: dialoflowMessageFormatting =
    eventObj.container.resolve(dialoflowMessageFormatting);
    const message = "We are Preparing Your response, please wait.";
    LocationService.sendLoctionResponse(intent,eventObj);
    const response = await dialoflowMessageFormattingObj.making_response(message);
    return  response;

};

