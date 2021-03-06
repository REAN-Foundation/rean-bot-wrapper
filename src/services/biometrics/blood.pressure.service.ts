import { getHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

let remark = '';
const getremark = function (Systolic,Diastolic) {

    if (Systolic <= 120 && Diastolic < 80) {
        remark = 'in normal range. Stay healthy!';
    } else if (Systolic <= 129 && Diastolic < 80) {
        remark = 'in elevated range.';
    } else if (Systolic <= 139 || Diastolic <= 89) {
        remark = 'high blood pressure stage 1.';
    } else if (Systolic < 180 || Diastolic < 120) {
        remark = 'high blood pressure stage 2. Please consult your Doctor.';
    } else if (Systolic < 300 || Diastolic < 150) {
        remark = 'high blood pressure stage 3. Please consult your Doctor.';
    }
    return remark;
};

export const updateBloodPressureInfoService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService);
        var { patientUserId, accessToken, Systolic, Diastolic, BloodPressure_Unit } = await checkEntry(eventObj);
        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");

        const url = `${ReanBackendBaseUrl}clinical/biometrics/blood-pressures/search?patientUserId=${patientUserId}`;
        
        const options = getHeaders(accessToken);
        const resp = await needle("get", url, options);
        const bloodPressureId = resp.body.Data.BloodPressureRecords.Items[0].id;

        let unitmsg = null;
        ({ unitmsg, BloodPressure_Unit } = getUnit(BloodPressure_Unit));
        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-pressures/${bloodPressureId}`;

        const obj = {
            "PatientUserId" : patientUserId,
            "Systolic"      : Systolic,
            "Diastolic"     : Diastolic,
            "Unit"          : BloodPressure_Unit
        };
        const response = await needle("put", apiUrl, obj, options);

        if (response.statusCode !== 200) {
            throw new Error("Failed to get response from API.");
        }
        const s = response.body.Data.BloodPressure.Systolic;
        const d = response.body.Data.BloodPressure.Diastolic;
        const u = response.body.Data.BloodPressure.Unit;

        remark = getremark(Systolic,Diastolic);
        const dffMessage = `${unitmsg}Your updated blood pressure Systolic: ${s} Diastolic:${d} ${u} is ${remark}`;
        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BloodGlucoseUpdate Info Service Error!`);
    }
};

export const createBloodPressureInfoService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService);
        var { patientUserId, accessToken, Systolic, Diastolic, BloodPressure_Unit } = await checkEntry(eventObj);

        let unitmsg = null;
        ({ unitmsg, BloodPressure_Unit } = getUnit(BloodPressure_Unit));
        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const options = getHeaders(accessToken);
        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-pressures`;

        const obj = {
            "PatientUserId" : patientUserId,
            "Systolic"      : Systolic,
            "Diastolic"     : Diastolic,
            "Unit"          : BloodPressure_Unit,
            "RecordDate"    : Date()
        };

        const response = await needle("post", apiUrl, obj, options);

        if (response.statusCode !== 201) {
            throw new Error("Failed to get response from API.");
        }
        remark = getremark(Systolic,Diastolic);
        const s = response.body.Data.BloodPressure.Systolic;
        const d = response.body.Data.BloodPressure.Diastolic;
        const u = response.body.Data.BloodPressure.Unit;

        const dffMessage = `${unitmsg}Your newly added blood pressure Systolic: ${s} Diastolic:${d} ${u} is ${remark}`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BloodGlucoseCreate Info Service Error!`);
    }
};

function getUnit(BloodPressure_Unit: any) {
    let unitmsg = '';
    if (BloodPressure_Unit === '') {
        BloodPressure_Unit = 'mmHg';
        unitmsg = `BloodPressure unit assumed to mmHg. `;

    }
    return { unitmsg, BloodPressure_Unit };
}

async function checkEntry(eventObj: any) {
    const Systolic = eventObj.body.queryResult.parameters.Systolic;
    const Diastolic = eventObj.body.queryResult.parameters.Diastolic;
    const BloodPressure_Unit = eventObj.body.queryResult.parameters.Unit;

    if (!Diastolic && !Systolic) {
        throw new Error("Missing required parameter Diastolic and/or Systolic");
    }
    let result = null;
    result = await getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);

    const patientUserId = result.message[0].UserId;
    const accessToken = result.message[0].accessToken;

    return { patientUserId, accessToken, Systolic, Diastolic, BloodPressure_Unit };
}

