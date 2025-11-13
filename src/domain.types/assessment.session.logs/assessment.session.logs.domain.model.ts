export interface AssessmentSessionLogsDto {
    autoIncrementalID?: number;
    userPlatformId: string;
    patientUserId: string;
    assessmentTemplateId: string;
    assesmentId: string;
    assesmentNodeId: string;
    userResponseType: string;
    userResponse: string;
    userResponseTime: Date;
    userMessageId: string;
    createdAt?: Date;
    updatedAt?: Date;
}
