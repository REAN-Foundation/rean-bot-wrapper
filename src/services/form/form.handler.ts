import { Iresponse, OutgoingMessage } from "../../refactor/interface/message.interface";
import { container, DependencyContainer, injectable } from "tsyringe";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import { WhatsappMetaMessageService } from "../whatsapp.meta.message.service";
import { commonResponseMessageFormat } from "../common.response.format.object";
import { ContactListRepo } from "../../database/repositories/contact.list/contact.list.repo";
import { ReancareAssessmentService } from "./reancare.assessment.service";

@injectable()
export class FormHandler {

    private _childContainer: DependencyContainer;

    private _clientEnvironmentProviderService: ClientEnvironmentProviderService;

    private _whatsappMetaMessageService: WhatsappMetaMessageService;

    constructor(private _reancareAssessmentService: ReancareAssessmentService) {
        this._childContainer = container.createChildContainer();
        this.registerInjections();
    }

    handleFormSubmission = async (responseData: OutgoingMessage) => {
        try {
            const submissionData = this.getFormSubmissionData(responseData);
            console.log("Handling form submission", JSON.stringify(submissionData));
            this.validateFormSubmissionData(submissionData);
            this._clientEnvironmentProviderService.setClientName(submissionData.ClientName);

            const user = await this.getBotUser(responseData.MetaData.platformId);

            submissionData.PatientUserId = user.patientUserId;

            const response = await this._reancareAssessmentService.submitAssessment(
                this._childContainer, submissionData
            );
            
            await this.sendAcknowledgement(responseData, response?.Message);

            console.log("Form submitted successfully", response);

        } catch (error) {
            console.log("Error handling form submission", error);
        }
    }
   
    private async getBotUser(platformId: string) {
        const user = await ContactListRepo.findContactByMobileNumber(this._childContainer, platformId);
        if (!user) throw new Error(`Patient user not found for platformId: ${platformId}`);
        return user;
    }
      
    private async sendAcknowledgement(responseData: OutgoingMessage, messageText?: string) {
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.messageText = messageText || "Thank you for your submission";
        response_format.message_type = "text";
        response_format.sessionId = responseData.MetaData.platformId;
        response_format.platform = "WhatsappMeta";
      
        await this._whatsappMetaMessageService.SendMediaMessage(response_format, null);
    }
      
    private getFormSubmissionData = (responseData: OutgoingMessage) => {
        const formSubmissionDataString = responseData.MetaData?.messageBody;
        if (!formSubmissionDataString || typeof formSubmissionDataString !== "string") {
            throw new Error(`Form submission data is not found: ${formSubmissionDataString}`);
        }
        const submissionData = JSON.parse(formSubmissionDataString);
        return submissionData;
    }

    private validateFormSubmissionData = (submissionData: any) => {
        if (!submissionData || typeof submissionData !== "object") {
            throw new Error(`Form submission data is not found: ${submissionData}`);
        }
        if (!("ClientName" in submissionData)) {
            throw new Error(`In Assessment With Form Submission, ClientName is not found: ${submissionData}`);
        }
        if (!("AssessmentWithForm" in submissionData)) {
            submissionData["AssessmentWithForm"] = true;
        }

        if (!("AssessmentTemplateId" in submissionData)) {
            throw new Error(`In Assessment With Form Submission, AssessmentTemplateId is not found: ${submissionData}`);
        }
        if (!("AssessmentTemplateTitle" in submissionData)) {
            throw new Error(`In Assessment With Form Submission, AssessmentId is not found: ${submissionData}`);
        }
        if (!("TenantId" in submissionData)) {
            throw new Error(`In Assessment With Form Submission, TenantId is not found: ${submissionData}`);
        }
        
    }

    private registerInjections = () => {
        try {
            this._childContainer.register(WhatsappMetaMessageService, { useClass: WhatsappMetaMessageService });
            this._whatsappMetaMessageService = this._childContainer.resolve(WhatsappMetaMessageService);
            this._clientEnvironmentProviderService = this._childContainer.resolve(ClientEnvironmentProviderService);
        } catch (error) {
            console.log("Error registering injections", error);
        }

    }

}
