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

    async postImageOnClickup(intent,eventObj){
        const URL = eventObj.body.queryResult.parameters.image;
        console.log("our image url is ",URL);
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
        const user_details = await this.getEMRDetails(user_info, eventObj);
        const topic = condition_string + "_" + user_info;
        console.log("topic is",topic);
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const channel = eventObj.body.originalDetectIntentRequest.payload.source;
        // eslint-disable-next-line max-len
        const userFeedbackRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(UserFeedback);
        await userFeedbackRepository.create({ userId: userId, channel: channel,humanHandoff: "false" });
        const responseUserFeedback = await userFeedbackRepository.findAll({ where: { userId: userId } });
        this.clickUpTask.createTask(null, responseUserFeedback,null,topic,user_details)
            .then((response) => { this.clickUpTask.taskAttachment(response.body.id,attachmentPath); });
    }

    async getEMRDetails(emr_number, eventObj){
        try {
            let response: any = {};
            response = await this.makeApiCall(emr_number, eventObj);
            let report = "### Patient Details\n";
            const patient_details = response.body.patient_details;
            if (response.body.patient_details) {
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
