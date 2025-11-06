import { Logger } from '../../common/logger.js';
import { getSymptoms } from '../../services/covid.symptom.service.js';

export const getSymptomAssessment = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Calling symptom Service !!!!!!');

        let response = null;
        response = await getSymptoms(eventObj);
        console.log('Inside listener: ', response);
        if (!response) {
            console.log('I am failed');
            throw new Error("Symptom Service Failed");
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Symptom Listener Error!');
        throw new Error("Symptom listener error");
    }
};

