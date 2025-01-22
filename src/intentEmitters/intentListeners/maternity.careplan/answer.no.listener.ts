import { AnswerNoMsgService } from "../../../services/maternalCareplan/serveAssessment/answer.no.service";

export const  AssessmentAnswerNoListener = async ( intent, eventObj) => {
    try {
        const answerNoMsgService: AnswerNoMsgService = eventObj.container.resolve(AnswerNoMsgService);
        const response = await answerNoMsgService.replyNoService(eventObj);
        return response;
    } catch (error) {
        throw new Error(`Handle maternity careplan intent ${error}`);
    }

};

