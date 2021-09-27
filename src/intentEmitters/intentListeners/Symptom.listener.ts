// Load required services here
import { Logger } from '../../common/logger';
import { getSymptoms } from '../../services/CovidSymptom.Service';

export const getSymptomAssessment = async (intent, eventObj) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        let res;
        try {
            Logger.instance()
                .log('Calling symptom Service !!!!!!');

            // Service Call
            let response = null;
            res = 5;
            response = await getSymptoms(eventObj, res);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Symptom Listener Error!');
            reject(error.message);
        }
    });
};

