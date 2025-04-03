export interface IAssessmentQuestions {
    id : number;
    assessmentQuestionId: string;
    assessmentId: string;
    assessmentTemplateId: string;
    questions: string;
    options: string;
    platformMessageId: string;
}