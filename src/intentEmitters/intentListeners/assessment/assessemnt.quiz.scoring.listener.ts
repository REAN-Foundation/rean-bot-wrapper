import { AnswerNoMsgService } from "../../../services/maternalCareplan/serveAssessment/answer.no.service";

export const  AssessmentScoringListener = async ( intent, eventObj) => {
    try {
        const answerNoMsgService: AnswerNoMsgService = eventObj.container.resolve(AnswerNoMsgService);
        const response = await answerNoMsgService.replyNoService(eventObj);
        return response;
    } catch (error) {
        throw new Error(`Assessment Scoring Listener Error ${error}`);
    }

};