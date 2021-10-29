import { Logger } from '../../common/logger';
import { getRiskAssessmentInfo as getRiskAssessmentInfos } from '../../services/risk.assessment.info.service';

export const getRiskAssessmentInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        let res;
        try {
            Logger.instance()
                .log('Calling risk assessment info Service !!!!!!');

            // Service Call
            let response = null;
            res = 5;
            response = await getRiskAssessmentInfos(eventObj, res);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Risk assessment info Listener Error!');
            reject(error.message);
        }
    });
};
