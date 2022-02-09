import { getHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

let remark = '';
const getremark = function (BloodOxygenSaturation) {

    if (BloodOxygenSaturation >= 96) {
        remark = 'in normal range.';
    } else if (BloodOxygenSaturation < 96 && BloodOxygenSaturation >= 95) {
        remark = 'little low. We suggest please continue home monitoring.';
    } else if (BloodOxygenSaturation < 95 && BloodOxygenSaturation >= 93) {
        remark = 'low. Please consult your Doctor.';
    } else if (BloodOxygenSaturation < 93) {
        remark = 'very low. Please consult your Doctor.';
    }
    return remark;
};

export const updateBloodOxygenSaturationInfoService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService);
        var { patientUserId, accessToken, BloodOxygenSaturation_Unit,
            BloodOxygenSaturation } = await checkEntry(eventObj);

        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const url = `${ReanBackendBaseUrl}clinical/biometrics/blood-oxygen-saturations/search?patientUserId=${patientUserId}`;
        
        const options = getHeaders(accessToken);
        const resp = await needle("get", url, options);
        const bloodOxygenSaturationId = resp.body.Data.BloodOxygenSaturationRecords.Items[0].id;
        
        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-oxygen-saturations/${bloodOxygenSaturationId}`;

        const obj = {
            "PatientUserId"         : patientUserId,
            "BloodOxygenSaturation" : BloodOxygenSaturation,
            "Unit"                  : BloodOxygenSaturation_Unit
        };

        const response = await needle("put", apiUrl, obj, options);

        if (response.statusCode !== 200) {
            throw new Error("Failed to get response from API.");
        }
        remark = getremark(BloodOxygenSaturation);
        const b = response.body.Data.BloodOxygenSaturation.BloodOxygenSaturation;
        const u = response.body.Data.BloodOxygenSaturation.Unit;

        const dffMessage = `Your updated BloodOxygenSaturation ${b} ${u} is ${remark}`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BloodOxygenSaturationUpdate Info Service Error!`);
    }
};

export const createBloodOxygenSaturationInfoService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService);
        var { patientUserId, accessToken, BloodOxygenSaturation_Unit,
            BloodOxygenSaturation } = await checkEntry(eventObj);
        
        const options = getHeaders(accessToken);
        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-oxygen-saturations`;

        const obj = {
            "PatientUserId"         : patientUserId,
            "BloodOxygenSaturation" : BloodOxygenSaturation,
            "Unit"                  : BloodOxygenSaturation_Unit,
            "RecordDate"            : Date()
        };

        const response = await needle("post", apiUrl, obj, options);

        if (response.statusCode !== 201) {
            throw new Error("Failed to get response from API.");
        }
        remark = getremark(BloodOxygenSaturation);
        const b = response.body.Data.BloodOxygenSaturation.BloodOxygenSaturation;
        const u = response.body.Data.BloodOxygenSaturation.Unit;

        const dffMessage = `Your newly added BloodOxygenSaturation ${b} ${u} is ${remark}`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BloodOxygenSaturationCreate Info Service Error!`);
    }
};

async function checkEntry(eventObj: any) {
    const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
    const BloodOxygenSaturation = eventObj.body.queryResult.parameters.BloodOxygenSaturation;
    let BloodOxygenSaturation_Unit = eventObj.body.queryResult.parameters.Unit;

    if (!phoneNumber && !BloodOxygenSaturation) {
        throw new Error("Missing required parameter PhoneNumber and/or BloodOxygenSaturation");
    }
    if (BloodOxygenSaturation_Unit === '') {
        BloodOxygenSaturation_Unit = '%';
    }
    let result = null;
    result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);

    const patientUserId = result.message[0].UserId;

    const accessToken = result.message[0].accessToken;
    return { patientUserId, accessToken, BloodOxygenSaturation_Unit, BloodOxygenSaturation };
}
