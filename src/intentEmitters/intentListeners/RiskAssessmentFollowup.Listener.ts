// Load required services here
import { Logger } from '../../common/logger';

import { getRiskAssessmentFollowup as getRiskAssessmentFollowups } from '../../services/RiskAssessmentFollowup.Service';

export const getRiskAssessmentFollowup = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        let res;
        try {
            Logger.instance()
                .log('Calling risk assessment followup Service !!!!!!');

            // Service Call
            let response = null;
            res = 5;
            response = await getRiskAssessmentFollowups(eventObj, res);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Risk followup Listener Error!');
            reject(error.message);
        }
    });
};
