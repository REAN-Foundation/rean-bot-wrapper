import { Logger } from '../../common/logger.js';
import { getRiskAssessmentInfo as getRiskAssessmentInfos } from '../../services/risk.assessment.info.service.js';

export const getRiskAssessmentInfo = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Calling risk assessment info Service !!!!!!');
        let response = null;

        // res = 5;
        response = await getRiskAssessmentInfos(eventObj);

        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error('Risk assessment info Service Failed');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Risk assessment info Listener Error!');
        throw new Error("Risk assessment info listnere error");
    }
};
