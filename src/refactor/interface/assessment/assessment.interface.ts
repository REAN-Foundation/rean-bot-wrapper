export interface AssessmentRequest {
    Type: string;
    Body: {
        PatientUserId           : string,
        PersonPhoneNumber       : string,
        AssessmentTemplateId    : string,
        Channel                 : string,
        AssessmentTemplateTitle : string
    };
}
