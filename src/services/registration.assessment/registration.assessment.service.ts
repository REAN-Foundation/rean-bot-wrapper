import { Logger } from '../../common/logger';
import { ContainerService } from '../container/container.service';
import { TenantSettingService } from '../tenant.setting/tenant.setting.service';
import { IntentRepo } from '../../database/repositories/intent/intent.repo';
import { RegistrationAssessmentMetaDataValidator } from './registration.assessment.metadata.validator';
import { AssessmentRequest } from '../../refactor/interface/assessment/assessment.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { NeedleService } from '../needle.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { MessageType } from '../../domain.types/common.types';

// AssessmentService is required lazily inside _triggerRegularAssessment to avoid
// a circular module dependency:
// patient.registration.service → RegistrationAssessmentEventQueue
//   → RegistrationAssessmentService → AssessmentService
//   → CommonAssessmentService → Registration (patient.registration.service) ← cycle
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getAssessmentService = () => require('../Assesssment/assessment.service').AssessmentService;

///////////////////////////////////////////////////////////////////////////////

export class RegistrationAssessmentService {

    public static trigger = async (
        clientName: string,
        channel   : string,
        platformUserId: string,
        patientUserId : string
    ): Promise<void> => {
        try {
            const apiKey  = process.env.REANCARE_API_KEY;
            const baseUrl = process.env.REAN_APP_BACKEND_BASE_URL;

            const isEnabled = await TenantSettingService.isBasicAssessmentEnabled(clientName, apiKey, baseUrl);
            if (!isEnabled) {
                Logger.instance().log(`RegistrationAssessment: BasicAssessment is disabled for client: ${clientName}`);
                return;
            }

            const childContainer = ContainerService.createChildContainer(clientName);
            if (!childContainer) {
                throw new Error('RegistrationAssessment: Failed to create child container');
            }

            const intentCode = `BasicRegistrationAssessment_${channel}`;
            Logger.instance().log(`RegistrationAssessment: Looking up intent with code: ${intentCode}`);

            const intent = await IntentRepo.findIntentByCode(childContainer, intentCode);
            if (!intent || !intent.Metadata) {
                Logger.instance().log(`RegistrationAssessment: Intent not found for code: ${intentCode}`);
                return;
            }

            const metadata = RegistrationAssessmentMetaDataValidator.validate(JSON.parse(intent.Metadata));

            // Fetch assessment template from ReanCare
            const needleService = childContainer.resolve(NeedleService);
            const apiURL = `clinical/assessment-templates/search?displayCode=${metadata.AssessmentDisplayCode}`;
            const templateResponse = await needleService.needleRequestForREAN('get', apiURL);

            if (!templateResponse?.Data?.AssessmentTemplateRecords?.Items?.length) {
                Logger.instance().log(`RegistrationAssessment: Assessment template not found for displayCode: ${metadata.AssessmentDisplayCode}`);
                return;
            }

            const template = templateResponse.Data.AssessmentTemplateRecords.Items[0];
            const assessmentTemplateId    = template.id;
            const assessmentTemplateTitle = template.Title;

            if (metadata.AssessmentType === 'whatsapp_flow') {

                // const tenantId = await TenantSettingService.getTenantId(clientName, apiKey, baseUrl);

                // await RegistrationAssessmentService._triggerWhatsAppFlowAssessment(
                //     childContainer,
                //     channel,
                //     platformUserId,
                //     clientName,
                //     assessmentTemplateId,
                //     assessmentTemplateTitle,
                //     tenantId,
                //     metadata.FlowName
                // );
            } else {
                await RegistrationAssessmentService._triggerRegularAssessment(
                    childContainer,
                    channel,
                    platformUserId,
                    patientUserId,
                    assessmentTemplateId,
                    assessmentTemplateTitle
                );
            }

        } catch (error) {
            Logger.instance().log(`RegistrationAssessment: Error triggering registration assessment: ${error.message}`);
        }
    };

    private static _triggerRegularAssessment = async (
        childContainer       : any,
        channel              : string,
        platformUserId       : string,
        patientUserId        : string,
        assessmentTemplateId : string,
        assessmentTemplateTitle: string
    ): Promise<void> => {
        const platformService = childContainer.resolve(channel) as platformServiceInterface;
        const AssessmentService = getAssessmentService();
        const assessmentService = childContainer.resolve(AssessmentService);

        const assessmentRequest: AssessmentRequest = {
            Type : 'StartAssessment',
            Body : {
                PatientUserId           : patientUserId,
                PersonPhoneNumber       : platformUserId,
                AssessmentTemplateId    : assessmentTemplateId,
                Channel                 : channel,
                AssessmentTemplateTitle : assessmentTemplateTitle
            }
        };

        Logger.instance().log(`RegistrationAssessment: Starting regular assessment for user: ${platformUserId}, template: ${assessmentTemplateTitle}`);
        await assessmentService.createAssessment(assessmentRequest, platformService);
    };

    private static _triggerWhatsAppFlowAssessment = async (
        childContainer       : any,
        channel              : string,
        platformUserId       : string,
        clientName           : string,
        assessmentTemplateId : string,
        assessmentTemplateTitle: string,
        tenantId             : string,
        flowName             : string
    ): Promise<void> => {
        const platformService = childContainer.resolve(channel) as platformServiceInterface;

        const responseFormat: Iresponse = commonResponseMessageFormat();
        responseFormat.message_type = MessageType.FLOW;
        responseFormat.sessionId    = platformUserId;

        const payload = {
            flowName              : flowName,
            flowActionPayloadData : {
                clientName,
                assessmentTemplateId,
                assessmentTemplateTitle,
                tenantId,
                AssessmentWithForm : true
            }
        };

        Logger.instance().log(`RegistrationAssessment: Sending WhatsApp flow "${flowName}" to user: ${platformUserId}`);
        await platformService.SendMediaMessage(responseFormat, payload);
    };

}
