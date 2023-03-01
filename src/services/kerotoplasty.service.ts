import { GetLocation } from "./find.nearest.location.service";
import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { autoInjectable } from "tsyringe";
import {ClickUpTask} from "./clickup/clickup.task";
import path from 'path';
import { UserFeedback } from "../models/user.feedback.model";

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
        const postalAddress= locationData["Postal Addres"];
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

    async postImageOnClickup(intent,eventObj){
        const URL = eventObj.body.queryResult.parameters.image;
        console.log("our image url is ",URL);
        const clickupService = new ClickUpTask();
        const filename = path.basename(URL);
        console.log("file name is ", filename);
        const attachmentPath = `./photo/` + filename;
        const condition = {
            'hyperCriticalCondition' : 'HyperCritical',
            'criticalCondition'      : 'Critical',
            'normalCondition'        : 'Normal'
        };
        const condition_string = condition[intent];
        const user_info = eventObj.body.queryResult.parameters.medicalRecordNumber;
        const topic = condition_string + "_" + user_info;
        console.log("topic is",topic);
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const responseUserFeedback = await UserFeedback.findAll({ where: { userId: userId } });
        clickupService.createTask(null, responseUserFeedback,null,topic)
            .then((response) => {clickupService.taskAttachment(response.body.id,attachmentPath);});
    }
}
