import { Logger } from '../../common/logger';
import { getSymptoms } from '../../services/covid.symptom.service';

export const getSymptomAssessment = async (intent, eventObj) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        // eslint-disable-next-line init-declarations
        try {
            Logger.instance()
                .log('Calling symptom Service !!!!!!');

            // Service Call
            let response = null;
            response = await getSymptoms(eventObj);

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

