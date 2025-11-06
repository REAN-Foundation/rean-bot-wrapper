import { Logger } from '../../common/logger.js';
import { getRiskAssessment as getRiskAssessments } from '../../services/risk.assessment.service.js';

export const RiskAssessmentListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Calling risk assessment Service !!!!!!');

        // Service Call
        let response = null;

        // res = 5;
        response = await getRiskAssessments(eventObj);

        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error('Error while calling risk assessment service');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'risk assessment Listener Error!');
        throw new Error("Risk assessment listener error");
    }
};
