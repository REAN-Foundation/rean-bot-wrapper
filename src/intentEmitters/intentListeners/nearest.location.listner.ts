import { NearestLocation } from "../.././utils/find.nearest.centers";
import { dialoflowMessageFormatting } from "../.././services/Dialogflow.service";

export const NearestLocationListner = async (intent:string, eventObj) => {
    const  LocationService:  NearestLocation = eventObj.container.resolve( NearestLocation);
    const dialoflowMessageFormattingObj: dialoflowMessageFormatting =
    eventObj.container.resolve(dialoflowMessageFormatting);
    let userLocationDetails = null;
    if (eventObj.body.queryResult.parameters.Location.latlong){
        userLocationDetails = eventObj.body.queryResult.parameters.Location.latlong;
    }
    else if (eventObj.body.queryResult.parameters.Location.zipcode){
        userLocationDetails = eventObj.body.queryResult.parameters.Location.zipcode;
    }
    else if (eventObj.body.queryResult.parameters.Location.District){
        userLocationDetails = eventObj.body.queryResult.parameters.Location.District;
    }
    const filterTags = {
        "severity" : "null"
    };
    const locationResponse =  await LocationService.findLocations(userLocationDetails, filterTags, null);
    const message =  await LocationService.formatLoctionResponse(locationResponse);
    const response = await dialoflowMessageFormattingObj.making_response(message);
    return  response;
    
};

