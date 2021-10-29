import { Logger } from '../../common/logger';
import { getGenericpediaservice, getGenericpediaChemistservice } from "../../services/genericpedia.service"

export const getGenericpedia = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling genericpedia Service to get available medicines')

            let res = 5
            const response = await getGenericpediaservice(eventObj, res);
            
            if (!response) {
                console.log("I am failed");
                reject(response)
            }

            resolve(response)

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Genericpedia Listener Error!")
            reject(error.message)
        }
    })
}


export const getGenericpediaChemist = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('Calling genericpedia Service to get available medicines')

            let res = 5
            const response = await getGenericpediaChemistservice(eventObj, res);
            
            if (!response) {
                console.log("I am failed");
                reject(response)
            }

            resolve(response)

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Genericpedia Listener Error!")
            reject(error.message)
        }
    })
}

