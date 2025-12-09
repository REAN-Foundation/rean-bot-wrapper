import * as asyncLib from 'async';
import { Lifecycle, scoped } from 'tsyringe';
import { RegistrationService } from './maternalCareplan/registration.service';
import { NeedBloodService } from './bloodWrrior/need.blood.service';
import { CreateReminderService } from './reminder/create.reminder.service';
import { EnrollPatientService } from './bloodWrrior/enroll.service';
import { GenerateCertificateService } from './bloodWrrior/generate.certificate.flow.service';
import { GenerateCertificateYesService } from './bloodWrrior/generate.certificate.yes.service';
import { RegistrationPerMinMsgService } from './maternalCareplan/registration.per.minute.sercice';
import { ServeAssessmentService } from './maternalCareplan/serveAssessment/serveAssessment.service';
import { ChecklistDateValidationService } from './bloodWrrior/checklist.date.validation.service';
import { CommonAssessmentService } from './Assesssment/common.assessment.service';
import { CincinnatiPerMinMsgService } from './maternalCareplan/cincannati.demo';
import { AcceptDonationRequestService } from './bloodWrrior/accept.donation.request.service';
import { ChangeTransfusionDateService } from './bloodWrrior/chnage.transfusion.date.service';
import { HeartFailureRegistrationService } from './heartFailureCareplan/enroll.heart.failure.careplan.service';

export interface QueueDoaminModel {
    Intent : string;
    Body   : any;
}

///////////////////////////////////////////////////////////////////////////////////

const ASYNC_TASK_COUNT = 4;

@scoped(Lifecycle.ContainerScoped)
export class FireAndForgetService {

    //#region Task queue

    static _q = asyncLib.queue((model: QueueDoaminModel, onCompleted) => {
        (async () => {
            await FireAndForgetService.queueTask(model);
            onCompleted(model);
        })();
    }, ASYNC_TASK_COUNT);
  
    public static enqueue = (model: QueueDoaminModel) => {
        FireAndForgetService._q.push(model, (model, error) => {
            if (error) {
                console.log(`Error recording Fire and Forget Service: ${JSON.stringify(error)}`);
                console.log(`Error recording Fire and Forget Service: ${JSON.stringify(error.stack, null, 2)}`);
            }
            else {
                console.log(`Fire and Forget Domain Model: ${model}`);
            }
        });
    };

    public static delay = ms => new Promise(res => setTimeout(res, ms));

    //#region Private static methods

    private static queueTask = async(model: QueueDoaminModel) => {

        if (model.Intent === "RegistrationDMC") {
            const eventObj = model.Body.EventObj;
            const _registrationService:  RegistrationService = eventObj.container.resolve(RegistrationService);
            await _registrationService.enrollPatientService(model.Body.PatientUserId,
                model.Body.Name,model.Body.LMP, eventObj );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "NeedBlood_Patient_Confirm_Yes") {
            const eventObj = model.Body.EventObj;
            const _needBloodService:  NeedBloodService = eventObj.container.resolve(NeedBloodService);
            await _needBloodService.needBloodNotifyVolunteer(model.Body, eventObj );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "M_Medication_Data_Yes") {
            const eventObj = model.Body.EventObj;
            const _createReminderService:  CreateReminderService = eventObj.container.resolve(CreateReminderService);
            await _createReminderService.sendReminder(model.Body, eventObj );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "Change_TF_Date_Load_Reminders") {
            const eventObj = model.Body.EventObj;
            const _enrollPatientService:  EnrollPatientService = eventObj.container.resolve(EnrollPatientService);
            await _enrollPatientService.enrollPatientService(eventObj, model.Body.PatientUserId );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "Generate_Certificate_Inform_Volunteer") {
            const eventObj = model.Body.EventObj;
            const generateCertificateService:  GenerateCertificateService =
                eventObj.container.resolve(GenerateCertificateService);
            await generateCertificateService.generateCertificateInformVolunteer(model.Body );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "Generate_Certificate_Yes") {
            const eventObj = model.Body.EventObj;
            const generateCertificateYesService:  GenerateCertificateYesService =
                eventObj.container.resolve(GenerateCertificateYesService);
            await generateCertificateYesService.generateCertificateForDonor(model.Body );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "Registration_PerMinMsg") {
            const eventObj = model.Body.EventObj;
            const registrationPerMinMsgService:  RegistrationPerMinMsgService =
                eventObj.container.resolve(RegistrationPerMinMsgService);
            await registrationPerMinMsgService.collectMessage(eventObj);
            console.log(`Fire and Forget Domain Model: ${model}`);
        }

        // List of valid intents
        const validAssessmentReplyIntents = [
            "Dmc_Yes",
            "Dmc_No",
            "option_A",
            "option_B",
            "option_C",
            "option_D",
            "Work_Commitments",
            "Feeling_Unwell_A",
            "Transit_Issues",
            "Assessment_Yes",
            "Assessment_No",
        ];

        if (validAssessmentReplyIntents.includes(model.Intent)) {
            const eventObj = model.Body.EventObj;
            const serveAssessmentService: ServeAssessmentService = eventObj.container.resolve(ServeAssessmentService);
            const channel = eventObj.body.originalDetectIntentRequest.payload.source;

            // Determine the message context ID based on the channel
            let messageContextId: string | null = null;
            if (channel === "telegram" || channel === "Telegram") {
                messageContextId = eventObj.body.originalDetectIntentRequest.payload.completeMessage.chat_message_id;
            } else {
                messageContextId = eventObj.body.originalDetectIntentRequest.payload.contextId;
            }

            // Extract user information
            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const userResponse = eventObj.body.queryResult.queryText;
            console.log("User response from the assessment: ",userResponse);

            // Delay for a brief period
            await FireAndForgetService.delay(1000);

            // Call the assessment service to process the response
            await serveAssessmentService.answerQuestion(
                eventObj,
                userId,
                userResponse,
                messageContextId,
                channel,
                false
            );
        }

        if (model.Intent === "cincinnati_PerMinMsg") {
            const eventObj = model.Body.EventObj;
            const cincinnatiPerMinMsgService:  CincinnatiPerMinMsgService =
                eventObj.container.resolve(CincinnatiPerMinMsgService);
            await cincinnatiPerMinMsgService.collectMessage(eventObj);
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "Checklist_Yes_Date") {
            const eventObj = model.Body.EventObj;
            const checklistDateValidationService:  ChecklistDateValidationService =
                eventObj.container.resolve(ChecklistDateValidationService);
            await checklistDateValidationService.sendConfirmationMessage(eventObj, model.Body.TransfusionDate,
                model.Body.Donor, model.Body.RequestedQuantity, model.Body.StringTransfusionDate,
                model.Body.PatientUserId, model.Body.VolunteerUserId, model.Body);
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "StartAssessment") {
            const eventObj = model.Body.EventObj;
            await FireAndForgetService.delay(2000);
            const commonAssessmentService:  CommonAssessmentService = 
                eventObj.container.resolve(CommonAssessmentService);
            await commonAssessmentService.startAssessmentAndUpdateDb(eventObj, model.Body.PatientUserId,
                model.Body.PersonPhoneNumber, model.Body.AssessmentTemplateId,
                model.Body.AssessmentTemplateTitle, model.Body.Channel);
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "Update_Accept_Donation_Flags") {
            const eventObj = model.Body.EventObj;
            const acceptDonationService:  AcceptDonationRequestService =
                eventObj.container.resolve(AcceptDonationRequestService);
            await acceptDonationService.updateCommunicationDetails(model.Body);
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "Volunteer_Update_TF_Date") {
            const eventObj = model.Body.EventObj;
            await FireAndForgetService.delay(1000);
            const changeTFDateService:  ChangeTransfusionDateService =
                eventObj.container.resolve(ChangeTransfusionDateService);
            await changeTFDateService.sendPatientListToVolunteer(model.Body);
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "RegistrationHeartFailure") {
            const eventObj = model.Body.EventObj;
            const _registrationService:  HeartFailureRegistrationService =
                eventObj.container.resolve(HeartFailureRegistrationService);
            await _registrationService.enrollPatientService(model.Body.PatientUserId,
                model.Body.Name, eventObj );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }

        if (model.Intent === "CareplanRegistrationForTestUser") {
            const eventObj = model.Body.EventObj;
            const _registrationService:  HeartFailureRegistrationService =
                eventObj.container.resolve(HeartFailureRegistrationService);
            await _registrationService.enrollPatientService(model.Body.PatientUserId,
                model.Body.Name, eventObj, true );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
    };

    //#endregion
    
}
