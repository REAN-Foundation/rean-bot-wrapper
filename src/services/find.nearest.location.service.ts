import { inject, Lifecycle, scoped } from "tsyringe";
import needle from "needle";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class GetLocation{
    
    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ) { }

    async getLoctionData(eventObj,severityGrade){
        let  userLocation = null;

        if (eventObj.body.queryResult.parameters.Location.latlong){
            userLocation = eventObj.body.queryResult.parameters.Location.latlong; 
        }
        else if (eventObj.body.queryResult.parameters.Location.zipcode){
            userLocation = eventObj.body.queryResult.parameters.Location.zipcode;
        }
        else if (eventObj.body.queryResult.parameters.Location.District){
            userLocation = eventObj.body.queryResult.parameters.Location.District;
        }

        try {
            const url = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("NEAREST_LOCATION_SERVICE_URL");
            console.log("our url is",url);
            var headers = {
                'Content-Type' : 'application/json',
                accept         : 'application/json'
            };
            const options = {
                headers : headers,
            };
            const obj = {
                location : userLocation,
                severity : severityGrade
            };
            const response = await needle("post",url, obj,options);
            if (response.statusCode === 200){
                return response.body;
            } else {
                return null;
            }

        } 
        catch (error) {
            console.log('LVPEI Institute location Listener Error!');
        }
    }

}
