import { Logger } from '../../common/logger.js';
import { getRiskAssessmentFollowup as getRiskAssessmentFollowups } from '../../services/risk.assessment.followup.service.js';

export const getRiskAssessmentFollowup = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Calling risk assessment followup Service !!!!!!');

        let response = null;
        response = await getRiskAssessmentFollowups(eventObj);

        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error('Risk followup Service Failed');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Risk followup Listener Error!');
        throw new Error("Risk assessment followup listener error");
    }
};
