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

export interface IAssessmentIdentifiers {
    autoIncrementalID?: number;
    assessmentSessionId?: number;
    identifier: string;
    identifierUnit: string;
    userResponseType: string;
}
