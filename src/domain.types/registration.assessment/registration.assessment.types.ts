export interface RegistrationAssessmentIntentMetadata {
    AssessmentDisplayCode : string;
    AssessmentType        : 'regular' | 'whatsapp_flow';
    FlowName?             : string;
}

export interface RegistrationAssessmentEvent {
    ClientName     : string;
    Channel        : string;
    PlatformUserId : string;
    PatientUserId  : string;
}
