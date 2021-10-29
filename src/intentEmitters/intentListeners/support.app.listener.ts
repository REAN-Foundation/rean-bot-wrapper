import { Logger } from '../../common/logger';
import { getPatientsByPhoneNumberservice, getMedicationInfoservice } from "../../services/support.app.service";

export const getMedicationInfo = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log('Calling support app Service !!!!!!')

            // Service Call
            console.log("Request parameter", eventObj.body.queryResult.parameters)
            if (!eventObj.body.queryResult.parameters.PhoneNumber) {
                reject("Missing required parameter PhoneNumber")
                return
            }

            let res = 5
            let phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber
            let patientNumber = eventObj.body.queryResult.parameters.PatientNumber ? eventObj.body.queryResult.parameters.PatientNumber : null
            let result;
            result = await getPatientsByPhoneNumberservice(phoneNumber, patientNumber);
            console.log("Result", result)

            if (result.sendDff) {
                resolve(result.message)
                return
            }

            // if there is only one patient profile associated, get medication for the same
            let patientUserId = result.message[0].UserId
            let accessToken = result.message[0].accessToken

            Logger.instance().log(`Fetching medication info for PatientUserId: ${patientUserId} & Access Token: ${accessToken}`)

            result = await getMedicationInfoservice(patientUserId, accessToken);

            console.log("Inside listener: ", result)

            if (!result.sendDff) {
                console.log("I am failed");
                reject(result.message)
            }

            resolve(result.message)

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Medication Info Listener Error!")
            reject(error.message)
        }
    })
}