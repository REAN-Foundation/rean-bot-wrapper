import { inject, Lifecycle, scoped } from "tsyringe";
import needle from "needle";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { NeedleService } from "./needle.service";

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
            console.log('LVPEI Institute location Listener Error!',error);
        }
    }

    async sendLoctionResponse(intent,eventObj) {
        try {
            console.log("STEP 4");
            const channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const needleService: NeedleService = eventObj.container.resolve(NeedleService);
            const locationData = await this.getLoctionData(eventObj,3);
            const postalAddresses = Array.from(locationData).map(obj => obj["Postal_Address"]);
            const address_1 = postalAddresses[0].replace(/\n/g, ', ');
            const address_2 = postalAddresses[1].replace(/\n/g, ', ');
            const address_3 = postalAddresses[2].replace(/\n/g, ', ');
            const address_4 = postalAddresses[3].replace(/\n/g, ', ');
            const location_response = `*Your Possible nearest centers are*: \n\n 1. ${address_1}  \n 2. ${address_2} \n 3. ${address_3} \n 4. ${address_4}`;
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            payload.completeMessage.messageType = 'text';
            payload.completeMessage.messageBody = location_response;
            payload.completeMessage.intent = 'nearest.location.send';
            if (channel === "whatsappMeta") {
                const endPoint = 'messages';
                const postData = {
                    "messaging_product" : "whatsapp",
                    "recipient_type"    : "individual",
                    "to"                : eventObj.body.originalDetectIntentRequest.payload.userId,
                    "type"              : "text",
                    "text"              : {
                        "body" : location_response
                    }
                };
                await needleService.needleRequestForWhatsappMeta("post", endPoint, JSON.stringify(postData), payload);
            } else if (channel === "telegram") {
                const postData = {
                    chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
                    text    : location_response
                };
                await needleService.needleRequestForTelegram("post", "sendMessage", postData, payload);
            } else {
                throw new Error("Invalid Channel");
            }
        } catch (error) {
            console.log(error);
            throw new Error("Send location error");
        }

    }

}
