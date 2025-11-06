import { Logger } from '../../common/logger.js';
import { GetPatientInfoService } from "../../services/support.app.service.js";

export const getMedicationInfo = async (intent, eventObj) => {
    try {
        const getPatientInfoService: GetPatientInfoService = eventObj.container.resolve(GetPatientInfoService);
        Logger.instance().log('Calling support app Service !!!!!!');

        console.log("Request parameter", eventObj.body.queryResult.parameters);
        let result;
        result = await getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);

        if (result.sendDff) {
            return result.message;
        }

        // if there is only one patient profile associated, get medication for the same
        const patientUserId = result.message[0].UserId;
        const accessToken = result.message[0].accessToken;

        Logger.instance().log(`Fetching medication info for PatientUserId: ${patientUserId} & Access Token: ${accessToken}`);

        result = await getPatientInfoService.getMedicationInfoservice(patientUserId, accessToken);

        console.log("Inside listener: ", result);

        if (!result.sendDff) {
            console.log("I am failed");
            throw new Error("Support app service error");
        }

        return result.message;

    } catch (error) {
        Logger.instance().log_error(error.message, 500, "Medication Info Listener Error!");
        throw new Error("Support app listener error");
    }
};
