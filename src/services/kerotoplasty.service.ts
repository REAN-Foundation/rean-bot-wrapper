import { GetLocation } from "./find.nearest.location.service";
import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export class kerotoplastyService {

    constructor(
        private DialogflowServices?: dialoflowMessageFormatting){}

    identifyCondition = async (eventObj) => {
        if (eventObj) {
            const dropInVision = eventObj.body.queryResult.parameters.complexDropInVision.name;
            const complexSeverePain = eventObj.body.queryResult.parameters.complexSeverePain.name;

            //const params = eventObj.body.queryResult.parameters;
            if (dropInVision === 'Yes' && complexSeverePain === 'Yes')
            {
                return await this.DialogflowServices.triggerIntent('triggerHyperCritical',eventObj);
            }
            else if (dropInVision === 'Yes' || complexSeverePain === 'Yes') {
                return await this.DialogflowServices.triggerIntent('triggerCritical',eventObj);
            }
            else {
                return await this.DialogflowServices.triggerIntent('triggerNormal',eventObj);
            }
        } else {
            throw new Error(`500, kerotoplasy response Service Error!`);
        }
    };

    async conditionSpecificResponse(intent,eventObj){
        const getLocationService = new GetLocation();
        const locationData = await getLocationService.getLoctionData(eventObj);
        let message = null;
        console.log("our location data is ",locationData);
        const postalAddress = locationData["Postal Addres"];
        const keys = Object.keys(locationData["Postal Addres"]);
        switch (intent) {
        case 'hyperCriticalCondition': {
            message = `Your situation seems Hyper-Critical, Please Visit the nearest care center as soon as possible.\n your nearest centers are: \n 1. ${postalAddress[keys[0]]}  \n 2. ${postalAddress[keys[1]]} `;
            break;
        }
        case 'criticalCondition':
        {
            message = `Your situation seems critical, Please visit us on the next appointment you can get.\n your nearest centers are: \n 1. ${postalAddress[keys[0]]}  \n 2. ${postalAddress[keys[1]]} `;
            break;
        }
        case 'normalCondition': {
            message = `Your situation seems Normal. Please visit us in our nearest center If their is Drop in vision or severe pain in your operated eye.\n your nearest centers are: \n 1. ${postalAddress[keys[0]]} \n 2. ${postalAddress[keys[1]]} `;
            break;
        }
        }
        const responseToSend = this.DialogflowServices.making_response(message);
        return responseToSend;

    }

}
