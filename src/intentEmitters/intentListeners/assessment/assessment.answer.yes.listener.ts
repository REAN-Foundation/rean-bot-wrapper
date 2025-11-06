import { AnswerYesMsgService } from "../../../services/maternalCareplan/serveAssessment/answer.yes.service.js";

export const  AssessmentAnswerYesListener = async (_intent, eventObj) => {
    try {
        const answerYesMsgService: AnswerYesMsgService = eventObj.container.resolve(AnswerYesMsgService);
        const response = await answerYesMsgService.replyYesService(eventObj);
        return response;
    } catch (error) {
        throw new Error(`Handle maternity careplan intent ${error}`);
    }

};
