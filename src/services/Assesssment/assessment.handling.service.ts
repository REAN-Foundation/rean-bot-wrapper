import { Lifecycle, scoped, inject } from 'tsyringe';
import { NeedleService } from '../needle.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../entity.manager.provider.service';
import { OutgoingMessage } from '../../refactor/interface/message.interface';
import { Registration } from '../registrationsAndEnrollements/patient.registration.service';
import { AssessmentRequest } from '../../refactor/interface/assessment/assessment.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { AssessmentService } from './assessment.service';
import { AssessmentResponseFormat } from '../response.format/assessment.service.response.format';
import { SystemGeneratedMessagesService } from '../system.generated.message.service';

@scoped(Lifecycle.ContainerScoped)
export class AssessmentHandlingService {

    constructor(
        @inject(ClientEnvironmentProviderService)
            private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(Registration) private registration?: Registration,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(AssessmentService) private assessmentService?: AssessmentService,
        @inject(SystemGeneratedMessagesService) private systemGeneratedMessageService?: SystemGeneratedMessagesService
    ) {}

    async initialiseAssessment(input: OutgoingMessage, assessmentDisplayCode, eventObj: platformServiceInterface) {
        try {
            let channel = input.MetaData.platform;
            if (channel === "Telegram") {
                channel = "telegram";
            }

            const platformUserId: string = input.MetaData.platformId;
            const platformUserName: string = input.MetaData.name;

            const patientIdArray = await this.registration.getPatientUserId(
                channel,
                platformUserId,
                platformUserName
            );

            const url = `clinical/assessment-templates/search?displayCode=${assessmentDisplayCode}`;
            const response = await this.needleService.needleRequestForREAN("get", url);

            let message = "";
            let responseMessage;

            if (response.Data.AssessmentTemplateRecords.Items.length !== 0) {
                const assessmentDetails = response.Data.AssessmentTemplateRecords.Items[0];
                const assessmentBody: AssessmentRequest = {
                    Type : "StartAssessment",
                    Body : {
                        PatientUserId           : patientIdArray.patientUserId,
                        PersonPhoneNumber       : platformUserId,
                        AssessmentTemplateId    : assessmentDetails.id,
                        Channel                 : channel,
                        AssessmentTemplateTitle : assessmentDetails.Title
                    }
                };
                this.assessmentService.createAssessment(assessmentBody, eventObj);
                const startAssessmentMessage = await this.systemGeneratedMessageService.getMessage("INITIALIZE_ASSESSMENT_MESSAGE");
                message = startAssessmentMessage ?? "We are starting an assessment for you please answer few of our questions.";
                responseMessage = this.getResponseMessage(message, "StartAssessment");
            } else {
                message = `Sorry for the inconvenience. Please try again or contact the team for further assistance.`;
                responseMessage = this.getResponseMessage(message, "AssessmentFailure");
            }
            const responseToSend = new AssessmentResponseFormat(responseMessage);
            return responseToSend;
        } catch (error) {
            console.log(error);
        }
    }

    public getResponseMessage(message: string, intent: string) {
        const responseMessage = {
            "message" : message,
            "intent"  : intent,
            "payload" : null
        };
        return responseMessage;
    }

}
