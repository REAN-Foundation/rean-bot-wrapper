import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClickUpTask } from "./clickup/clickup.task";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import path from 'path';
import needle from 'needle';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ContactList } from '../models/contact.list';
import { NeedleService } from "./needle.service";

@scoped(Lifecycle.ContainerScoped)
export class kerotoplastyService {

    private retryNumber = 0;

    constructor(
        @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting,
        @inject(ClickUpTask) private clickUpTask?: ClickUpTask,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    identifyCondition = async (eventObj) => {
        if (eventObj) {
            const dropInVision = eventObj.body.queryResult.parameters.complexDropInVision.name;
            const complexSeverePain = eventObj.body.queryResult.parameters.complexSeverePain.name;
            let condition = null;

            //const params = eventObj.body.queryResult.parameters;
            if (dropInVision === 'Yes' && complexSeverePain === 'Yes')
            {
                condition  = 'HyperCritical';
            }
            else if (dropInVision === 'Yes' || complexSeverePain === 'Yes') {
                condition = 'Critical';
            }
            else {
                condition = 'Normal';
            }
            return condition;
        } else {
            throw new Error(`500, kerotoplasy response Service Error!`);
        }
    };

    async conditionSpecificResponse(condition){
        let severityGrade = null;
        let message = null;
        switch (condition) {
        case 'HyperCritical': {
            message = `Your situation seems *hyper-critical*.\n Please Visit the nearest care center as soon as possible.`;
            severityGrade = 1;
            break;
        }
        case 'Critical':
        {
            message = `Your situation seems *critical*.\n Please visit us at the nearest center on the next available appointment.`;
            severityGrade = 2;
            break;
        }
        case 'Normal': {
            message = `Your situation seems *normal*.\n Please visit us at our nearest center if there is drop in vision or severe pain in your operated eye.`;
            severityGrade = 3;
            break;
        }
        }
        message = await this.DialogflowServices.making_response(message);
        console.log("Our location data is being sent!!!!");
        return [message, severityGrade];

    }

    async symptomByUser(parameters){
        var symptomComment = "Patient is suffering from \n";

        if (parameters.complexNormalSymptoms.length !== 0){
            for (let i = 0; i < parameters.complexNormalSymptoms.length; i++){
                symptomComment += ` - ${parameters.complexNormalSymptoms[i].name} \n`;
            }

        }
        if (parameters.complexSeverePain.name === "Yes"){
            symptomComment += " - Severe pain \n";
        }
        if (parameters.complexDropInVision.name === "Yes"){
            symptomComment += " - Drop in vision \n";
        }
        return (symptomComment);
    }

    async postingImage(eventObj){
        try {
            const parameters = eventObj.body.queryResult.parameters;
            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const filename = path.basename(parameters.imageUrl);
            const attachmentPath = `./photo/` + filename;
            const contactList =
            (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ContactList);
            const personContactList = await contactList.findOne({ where: { mobileNumber: userId } });
            const repetitionFlag  = personContactList.dataValues.repetitionFlag;
            const taskId = personContactList.dataValues.cmrCaseTaskID;
            if (taskId){
                await this.clickUpTask.taskAttachment(taskId,attachmentPath);
            }
            return repetitionFlag;
        } catch (error) {
            console.log(error);
        }

    }

    async postingOnClickup(intent,eventObj,severityGrade){
        const parameters = eventObj.body.queryResult.parameters;
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const contactList =
        (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ContactList);
        const personContactList = await contactList.findOne({ where: { mobileNumber: userId } });
        let EMRNumber  = personContactList.dataValues.ehrSystemCode.toUpperCase();
        if (EMRNumber) {
            EMRNumber = EMRNumber.toUpperCase();
        }
        const ClickupListID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_CASE_LIST_ID");
        if (intent === "appointment-followconditionIdentification"){
            await contactList.update({ repetitionFlag: "True" }, { where: { mobileNumber: userId } });
        }
        else {
            await contactList.update({ repetitionFlag: "False" }, { where: { mobileNumber: userId } });
        }
        const symptomComment = await this.symptomByUser(parameters);
        const user_details = await this.getEMRDetails(EMRNumber , eventObj);
        const taskId = personContactList.dataValues.cmrCaseTaskID;
        if (taskId){
            await this.clickUpTask.updateTask(taskId,severityGrade,user_details,EMRNumber);
            await this.clickUpTask.postCommentOnTask(taskId,symptomComment);
        }
        else
        {
            const taskID = await this.clickUpTask.createTask( null, EMRNumber, user_details, severityGrade, ClickupListID );
            await contactList.update({ cmrCaseTaskID: taskID }, { where: { mobileNumber: userId } });
            await this.clickUpTask.postCommentOnTask(taskID, symptomComment);
            await contactList.update({ cmrCaseTaskID: taskID, humanHandoff: "false" }, { where: { mobileNumber: userId } });

        }

    }

    async appoinmentDetailsByUser(parameters)
    {
        let AppoinmentComment  = "Patient is requesting for Appointment\n";

        if (parameters.Date){
            const date = new Date(parameters.Date.date_time).toDateString();
            AppoinmentComment += ` - Date : ${ date} \n`;
        }
        if (parameters.Location){
            AppoinmentComment  += ` - Hospital : ${parameters.Location} \n`;
        }
        if (parameters.Doctor){
            AppoinmentComment  += ` - Doctor : ${parameters.Doctor.name} \n`;
        }
        return (AppoinmentComment);
    }

    async CheckRepetitionFlag(eventObj){
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const contactList =
        (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ContactList);
        const personContactList = await contactList.findOne({ where: { mobileNumber: userId } });
        const repetitionFlag = personContactList.dataValues.repetitionFlag;
        await contactList.update({ repetitionFlag: "True" }, { where: { mobileNumber: userId } });
        return repetitionFlag;
    }

    async UpdatingAppointmentOnClickup(intent,eventObj){
        const parameters = eventObj.body.queryResult.parameters;
        const symptomComment = await this.appoinmentDetailsByUser(parameters);
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const contactList =
        (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ContactList);
        const personContactList = await contactList.findOne({ where: { mobileNumber: userId } });
        const taskId = personContactList.dataValues.cmrCaseTaskID;
        let user_details = null;
        let EMRNumber  = personContactList.dataValues.ehrSystemCode;
        if (EMRNumber) {
            EMRNumber = EMRNumber.toUpperCase();
            user_details = await this.getEMRDetails(EMRNumber,eventObj);
        } else {
            const shareable_details_raw = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("SHAREABLE_DETAILS");
            if (shareable_details_raw){
                const shareable_details = JSON.parse(shareable_details_raw);
                if (shareable_details.Name){
                    user_details = `Name : ${personContactList.username}`;
                }
                if (shareable_details.Mobile){
                    user_details = user_details + `\n Mobile Number : ${personContactList.mobileNumber}`;
                }
            }
        }

        const ClickupListID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_CASE_LIST_ID");
        if (taskId){
            await this.clickUpTask.updateTask(taskId,null,user_details,EMRNumber, "Appointment");
            await this.clickUpTask.postCommentOnTask(taskId,symptomComment);
        }
        else
        {
            const taskID = await this.clickUpTask.createTask(null, EMRNumber , user_details , 1 , ClickupListID,"Appoinment");
            await contactList.update({ cmrCaseTaskID: taskID }, { where: { mobileNumber: userId } });
            await this.clickUpTask.postCommentOnTask(taskID, symptomComment);
            console.log("we are Here");
            await contactList.update({ cmrCaseTaskID: taskID, humanHandoff: "false" }, { where: { mobileNumber: userId } });
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

                const age = await this.getAge(patient_details.DOB);
                report = report + "- Age : " + age + '\n';

                report = report + "### Previous Diagnosis : \n";
                for (const diag of response.body.diagnosis) {
                    report = report + `- ` + diag.diag_title + '\n';
                }

                report = report + "### Prescription \n";
                report = report + "- General\n";
                if (response.body.Last_Prescription){
                    for (const pres of response.body.Last_Prescription[0].general) {
                        report = report + '  - Medicine Name:' + pres.MedicineName + '\n';
                        report = report + '  - Generic Name:' + pres.GenericName + '\n';
                        report = report + '  - Dosage: ' + pres.Dosage + '\n';
                        report = report + '  - Frequency: ' + pres.Frequency1 + '\n';
                        report = report + '  - Duration: ' + pres.Duration22 + '\n';
                        report = report + '  - Root: ' + pres.Root1 + '\n';
                        report = report + '  - Prescription Date: ' + pres.Prescribed_date_time + '\n';
                    }
                    report = report + "- Taper Drops\n";
                } else {
                    report = report + '  - No General Prescription Found\n';
                }

                report = report + "### Surgeries \n";
                for (const operate of response.body.surgeries) {
                    report = report + '- Procedure Info : ' + operate.procedure_info + '\n';
                    report = report + '  - Surgeon Name : ' +  operate.surgeon_name + '\n';
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

    async getAge(dateString) {
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
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
            open_timeout : 120000
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
            if (this.retryNumber < 7){
                await this.sleep(30000);
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
