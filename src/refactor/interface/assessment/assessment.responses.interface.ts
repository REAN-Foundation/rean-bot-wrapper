import { AssessmentResponseType } from "../../../refactor/messageTypes/assessment/assessment.responses.types";

export interface IAssessmentResponses {
    id: number;
    name: string;
    code: string;
    type: AssessmentResponseType;
    metaData: JSON;
}