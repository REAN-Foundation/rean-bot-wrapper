import { Logger } from '../../common/logger';
import { getGenericpediaservice, getGenericpediaChemistservice } from "../../services/genericpedia.service";

export const getGenericpedia = async (intent, eventObj) => {
    try {
        Logger.instance().log('Calling genericpedia Service to get available medicines');

        const res = 5;
        const response = await getGenericpediaservice(eventObj, res);
        
        if (!response) {
            console.log("I am failed");
            throw new Error("Genericpedia Service Failed");
        }

        return response;

    } catch (error) {
        Logger.instance().log_error(error.message, 500, "Genericpedia Listener Error!");
        throw new Error("Genericpedia listener error");
    }
};

export const getGenericpediaChemist = async (intent, eventObj) => {
    try {
        console.log('Calling genericpedia Service to get available medicines');

        const res = 5;
        const response = await getGenericpediaChemistservice(eventObj, res);
        
        if (!response) {
            console.log("I am failed");
            throw new Error("Genericpedia Service Failed");
        }

        return response;

    } catch (error) {
        Logger.instance().log_error(error.message, 500, "Genericpedia Listener Error!");
        throw new Error("Genericpedia listener error");
    }
};

