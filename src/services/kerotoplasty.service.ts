import { GetLocation } from "./find.nearest.location.service";
import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClickUpTask } from "./clickup/clickup.task";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import path from 'path';
import { UserFeedback } from "../models/user.feedback.model";
import needle from 'needle';
import { EntityManagerProvider } from "./entity.manager.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class kerotoplastyService {

    private retryNumber = 0;

    constructor(
        @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting,
        @inject(GetLocation) private getLocation?: GetLocation,
        @inject(ClickUpTask) private clickUpTask?: ClickUpTask,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,

        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

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
        const locationData = await this.getLocation.getLoctionData(eventObj);
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
    
    async symptomByUser(parameters){
        var symptomComment = "Patient is suffering from \n";
        
        if (parameters.complexNormalSymptoms.length !== 0){
            for (let i = 0; i < parameters.complexNormalSymptoms.length; i++){
                symptomComment += ` ${parameters.complexNormalSymptoms[i].name} \n`;
            }
            
        }
        if (parameters.complexSeverePain.name === "Yes"){
            symptomComment += "Severe pain \n";
        }
        if (parameters.complexDropInVision.name === "Yes"){
            symptomComment += "Drop in vision \n";
        }
        return (symptomComment);
    }

    async postingOnClickup(intent,eventObj){
        const parameters = eventObj.body.queryResult.parameters;
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const filename = path.basename(parameters.image);
        const symptomComment = await this.symptomByUser(parameters);
        const attachmentPath = `./photo/` + filename;
        const set_priority = {
            'hyperCriticalCondition' : 1,
            'criticalCondition'      : 2,
            'normalCondition'        : 3
        };
        const priority = set_priority[intent];
        const user_details = await this.getEMRDetails(parameters.medicalRecordNumber, eventObj);
        const topic =  parameters.medicalRecordNumber;
        // eslint-disable-next-line max-len
        const userFeedbackRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(UserFeedback);
        const responseUserFeedback = await userFeedbackRepository.findAll({ where: { userId: payload.userId } });
        if (responseUserFeedback[responseUserFeedback.length - 1].taskID){
            const taskID = responseUserFeedback[responseUserFeedback.length-1].taskID;
            await this.clickUpTask.updateTask(taskID,priority,user_details);
            await this.clickUpTask.taskAttachment(taskID,attachmentPath);
            await this.clickUpTask.postCommentOnTask(taskID,symptomComment);
        }
        else
        {
            const taskID = await this.clickUpTask.createTask(null, responseUserFeedback,topic,user_details,priority);
            await this.clickUpTask.taskAttachment(taskID,attachmentPath);
            await this.clickUpTask.postCommentOnTask(taskID,symptomComment);
            await userFeedbackRepository.create({userId: payload.userId, taskID: taskID,channel: payload.source,humanHandoff: "false"});

        }

    }

    async getEMRDetails(emr_number, eventObj){
        try {
            let response: any = {};
            response = await this.makeApiCall(emr_number, eventObj);
            let report = "### Patient Details\n";
            if (response.body.patient_details) {
                const patient_details = response.body.patient_details;
                report = report + "- Name : " + patient_details.FirstName + ' ' + patient_details.LastName + '\n';
                report = report + "- Gender : " + patient_details.Gender + '\n';
                report = report + "- DOB : " + patient_details.DOB + '\n';
                report = report + "### Previous Diagnosis : \n";
                for (const diag of response.body.diagnosis) {
                    report = report + `- ` + diag.diag_title + '\n';
                }
                report = report + "### Surgeries \n";
                for (const operate of response.body.surgeries) {
                    report = report + '- Procedure Info : ' + operate.procedure_info + '\n';
                    report = report + '  - Surgeon Name : ' + operate.surgeon_name + '\n';
                }
                report = report + '### Patient Visit History\n';
                report = report + '- ' + 'First Visit Date : ' + patient_details.first_visit_date + '\n';
                report = report + '- ' + 'First Visited Doctor : ' + patient_details.first_visted_doctor + '\n';
                report = report + '- ' + 'Last Visit Date : ' + patient_details.last_visted_date + '\n';
                report = report + '- ' + 'Last Visited Doctor : ' + patient_details.last_visted_doctor + '\n';
            } else {
                report = report + "No Patient Details Found";
            }
            console.log(report);
            return report;
        } catch (error) {
            console.log(error);
        }
    }

    async retryWithDelay(fn, retries = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            function attempt() {
                fn()
                    .then(resolve)
                    .catch((err) => {
                        if (retries === 0) {
                            reject(err);
                        } else {
                            retries--;
                            setTimeout(attempt, delay);
                        }
                    });
            }
            attempt();
        });
    }

    async makeApiCall(emr_number, eventObj) {
        const clientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
        const url = clientEnvironmentProviderService.getClientEnvironmentVariable("EMR_URL");
        const key = clientEnvironmentProviderService.getClientEnvironmentVariable("EMR_KEY");
        const code = clientEnvironmentProviderService.getClientEnvironmentVariable("EMR_CODE");
        var headers = {
            'Content-Type' : 'application/json',
            accept         : 'application/json'
        };
        const options = {
            headers      : headers,
            open_timeout : 60000
        };
        const obj = {
            code : code,
            key  : key,
            mrno : emr_number
        };
        try {
            const response = await needle("get",url, obj,options);
            this.retryNumber = 0;
            return response;
        } catch (err) {
            console.log(err);
            this.retryNumber++;
            if (this.retryNumber < 5){
                await this.sleep(10000);
                return await this.makeApiCall(emr_number,eventObj);
            }
        }
    }

    async sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    
}
