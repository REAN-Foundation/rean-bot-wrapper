import { getHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
    ClientEnvironmentProviderService);

let remark = '';
const getremark = function (BloodGlucose) {

    if (BloodGlucose < 53) {
        remark = 'very low. Please consult your doctor.';
    } else if (BloodGlucose < 70 && BloodGlucose >= 53) {
        remark = 'low. We suggest please continue home monitoring.';
    } else if (BloodGlucose < 125 && BloodGlucose >= 70) {
        remark = 'in normal range. Stay healthy!';
    } else if (BloodGlucose < 200 && BloodGlucose >= 125) {
        remark = 'high. Please consult your Doctor.';
    } else if (BloodGlucose >= 200) {
        remark = 'very high. Please consult your Doctor.';
    }
    return remark;
};

export const updateBloodGlucoseInfoService = async (eventObj) => {

    if (eventObj) {
        var { patientUserId, accessToken, BloodGlucose_Unit, BloodGlucose } = await checkEntry(eventObj);
        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");

        const url = `${ReanBackendBaseUrl}clinical/biometrics/blood-glucose/search?patientUserId=${patientUserId}`;
        const options = getHeaders(accessToken);
        const resp = await needle("get", url, options);
        const bloodGlucoseId = resp.body.Data.BloodGlucoseRecords.Items[0].id;

        let unitmsg = null;
        ({ unitmsg, BloodGlucose_Unit } = getUnit(BloodGlucose_Unit));
        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-glucose/${bloodGlucoseId}`;

        const obj = {
            "PatientUserId" : patientUserId,
            "BloodGlucose"  : BloodGlucose,
            "Unit"          : BloodGlucose_Unit
        };

        const response = await needle("put", apiUrl, obj, options);

        if (response.statusCode !== 200) {
            throw new Error("Failed to get response from API.");
        }
        remark = getremark(BloodGlucose);

        const dffMessage = `${unitmsg}Your updated BloodGlucose ${response.body.Data.BloodGlucose.BloodGlucose} ${response.body.Data.BloodGlucose.Unit} is ${remark}`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BloodGlucoseUpdate Info Service Error!`);
    }
};

export const createBloodGlucoseInfoService = async (eventObj) => {

    if (eventObj) {
        var { patientUserId, accessToken, BloodGlucose_Unit, BloodGlucose } = await checkEntry(eventObj);

        let unitmsg = null;
        ({ unitmsg, BloodGlucose_Unit } = getUnit(BloodGlucose_Unit));
        const options = getHeaders(accessToken);
        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-glucose`;

        const obj = {
            "PatientUserId" : patientUserId,
            "BloodGlucose"  : BloodGlucose,
            "Unit"          : BloodGlucose_Unit,
            "RecordDate"    : Date()
        };

        const response = await needle("post", apiUrl, obj, options);

        if (response.statusCode !== 201) {
            throw new Error("Failed to get response from API.");
        }
        remark = getremark(BloodGlucose);

        const dffMessage = `${unitmsg}Your newly added BloodGlucose ${response.body.Data.BloodGlucose.BloodGlucose} ${response.body.Data.BloodGlucose.Unit} is ${remark}`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BloodGlucoseCreate Info Service Error!`);
    }
};

function getUnit(BloodGlucose_Unit: any) {
    let unitmsg = '';
    if (BloodGlucose_Unit === '') {
        BloodGlucose_Unit = 'mg/dL';
        unitmsg = `BloodGlucose unit assumed to mg/dL. `;

    }
    return { unitmsg, BloodGlucose_Unit };
}

async function checkEntry(eventObj: any) {
    const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
    const BloodGlucose = eventObj.body.queryResult.parameters.BloodGlucose_Amount;
    const BloodGlucose_Unit = eventObj.body.queryResult.parameters.BloodGlucose_unit;

    if (!phoneNumber && !BloodGlucose) {
        throw new Error("Missing required parameter PhoneNumber and/or BloodGlucose");
    }
    let result = null;
    result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);

    const patientUserId = result.message[0].UserId;

    const accessToken = result.message[0].accessToken;
    return { patientUserId, accessToken, BloodGlucose_Unit, BloodGlucose };
}
