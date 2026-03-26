import { RegistrationAssessmentIntentMetadata } from '../../domain.types/registration.assessment/registration.assessment.types';

export class RegistrationAssessmentMetaDataValidator {

    static validate = (metadata: any): RegistrationAssessmentIntentMetadata => {
        if (!metadata) {
            throw new Error('RegistrationAssessment: Metadata is required');
        }

        if (!metadata.AssessmentDisplayCode || typeof metadata.AssessmentDisplayCode !== 'string') {
            throw new Error('RegistrationAssessment: Metadata.AssessmentDisplayCode is required');
        }

        if (!metadata.AssessmentType) {
            throw new Error('RegistrationAssessment: Metadata.AssessmentType is required');
        }

        if (metadata.AssessmentType !== 'regular' && metadata.AssessmentType !== 'whatsapp_flow') {
            throw new Error(`RegistrationAssessment: Invalid AssessmentType "${metadata.AssessmentType}". Must be "regular" or "whatsapp_flow"`);
        }

        if (metadata.AssessmentType === 'whatsapp_flow' && !metadata.FlowName) {
            throw new Error('RegistrationAssessment: Metadata.FlowName is required when AssessmentType is "whatsapp_flow"');
        }

        const result: RegistrationAssessmentIntentMetadata = {
            AssessmentDisplayCode : metadata.AssessmentDisplayCode,
            AssessmentType        : metadata.AssessmentType,
            FlowName              : metadata.FlowName ?? null,
        };

        return result;
    };

}
