import { getHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
    ClientEnvironmentProviderService);
const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");

let remark = '';
const getremark = function (Pulse) {

    if (Pulse <= 100 && Pulse > 40) {
        remark = 'in normal range. Stay healthy!';
    } else if (Pulse <= 109 && Pulse > 100) {
        remark = 'little high. We suggest please continue home monitoring.';
    } else if (Pulse <= 130 && Pulse > 109) {
        remark = 'high. Please consult your Doctor.';
    } else if (Pulse > 130) {
        remark = 'very high. Please consult your Doctor.';
    }
    return remark;
};

export const updatePulseInfoService = async (eventObj) => {

    if (eventObj) {
        var { patientUserId, accessToken, Pulse_Unit, Pulse } = await checkEntry(eventObj);

        const url = `${ReanBackendBaseUrl}clinical/biometrics/pulse/search?patientUserId=${patientUserId}`;
        
        const options = getHeaders(accessToken);
        const resp = await needle("get", url, options);
        const pulseId = resp.body.Data.PulseRecords.Items[0].id;
        
        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/Pulse/${pulseId}`;

        const obj = {
            "patientUserId" : patientUserId,
            "Pulse"         : Pulse,
            "Unit"          : Pulse_Unit
        };

        const response = await needle("put", apiUrl, obj, options);

        if (response.statusCode !== 200) {
            throw new Error("Failed to get response from API.");
        }
        remark = getremark(Pulse);

        const dffMessage = `Your updated Pulse ${response.body.Data.Pulse.Pulse} ${response.body.Data.Pulse.Unit} is ${remark}`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return response.message = data;
    } else {
        throw new Error(`500, PulseUpdate Info Service Error!`);
    }
};

export const createPulseInfoService = async (eventObj) => {

    if (eventObj) {
        var { patientUserId, accessToken, Pulse_Unit, Pulse } = await checkEntry(eventObj);
        
        const options = getHeaders(accessToken);
        
        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/Pulse`;

        const obj = {
            "patientUserId" : patientUserId,
            "Pulse"         : Pulse,
            "Unit"          : Pulse_Unit,
            "RecordDate"    : Date()
        };

        const response = await needle("post", apiUrl, obj, options);

        if (response.statusCode !== 201) {
            throw new Error("Failed to get response from API.");
        }
        remark = getremark(Pulse);

        const dffMessage = `Your newly added Pulse ${response.body.Data.Pulse.Pulse} ${response.body.Data.Pulse.Unit} is ${remark}`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return response.message = data;
    } else {
        throw new Error(`500, PulseCreate Info Service Error!`);
    }
};

async function checkEntry(eventObj: any) {
    const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
    const Pulse = eventObj.body.queryResult.parameters.Pulse;
    let Pulse_Unit = eventObj.body.queryResult.parameters.Pulse_Unit;

    if (Pulse_Unit === '') {
        Pulse_Unit = 'bpm';
    }

    if (!phoneNumber && !Pulse) {
        throw new Error("Missing required parameter PhoneNumber and/or Pulse");
    }
    let result = null;
    result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);

    const patientUserId = result.message[0].UserId;

    const accessToken = result.message[0].accessToken;
    return { patientUserId, accessToken, Pulse_Unit, Pulse };
}
