import { Logger } from '../../common/logger';
import { getRiskAssessment as getRiskAssessments } from '../../services/risk.assessment.service';

export const RiskAssessmentListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
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
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'risk assessment Listener Error!');
            reject(error.message);
        }
    });
};
