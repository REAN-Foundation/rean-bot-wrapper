import { getHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

export const updateBodyWeightInfoService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService);
        var { patientUserId, accessToken, BodyWeight_Unit, BodyWeight } = await checkEntry(eventObj);
        
        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const url = `${ReanBackendBaseUrl}clinical/biometrics/body-weights/search?patientUserId=${patientUserId}`;
        const options = getHeaders(accessToken);
        const resp = await needle("get", url, options);
        const bodyWeightId = resp.body.Data.BodyWeightRecords.Items[0].id;

        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-weights/${bodyWeightId}`;

        const obj = {
            "PatientUserId" : patientUserId,
            "BodyWeight"    : BodyWeight,
            "Unit"          : BodyWeight_Unit
        };

        const response = await needle("put", apiUrl, obj, options);

        if (response.statusCode !== 200) {
            throw new Error("Failed to get response from API.");
        }
        const w = response.body.Data.BodyWeight.BodyWeight;

        const dffMessage = `Your updated BodyWeight is ${w} ${response.body.Data.BodyWeight.Unit}.`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BodyWeightUpdate Info Service Error!`);
    }
};

export const createBodyWeightInfoService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService);
        var { patientUserId, accessToken, BodyWeight_Unit, BodyWeight } = await checkEntry(eventObj);
        
        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const options = getHeaders(accessToken);
        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-weights`;

        const obj = {
            "PatientUserId" : patientUserId,
            "BodyWeight"    : BodyWeight,
            "Unit"          : BodyWeight_Unit,
            "RecordDate"    : Date()
        };

        const response = await needle("post", apiUrl, obj, options);

        if (response.statusCode !== 201) {
            throw new Error("Failed to get response from API.");
        }
        const w = response.body.Data.BodyWeight.BodyWeight;

        const dffMessage = `Your newly added BodyWeight is ${w} ${response.body.Data.BodyWeight.Unit}.`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BodyWeightCreate Info Service Error!`);
    }
};

async function checkEntry(eventObj: any) {
    const BodyWeight = eventObj.body.queryResult.parameters.Weight_Amount;
    let BodyWeight_Unit = eventObj.body.queryResult.parameters.Weight_unit;

    const b = eventObj.body.session;
    const phoneNumber = b.split("/", 5)[4];

    const ten_digit = phoneNumber.substr(phoneNumber.length - 10);
    const country_code = phoneNumber.split(ten_digit)[0];

    if (BodyWeight_Unit === '') {
        if (country_code === '+91-') {
            BodyWeight_Unit = 'Kg';
        } else if (country_code === '+1-') {
            BodyWeight_Unit = 'lb';
        }
    }
    let result = null;
    result = await getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
    const patientUserId = result.message[0].UserId;
    const accessToken = result.message[0].accessToken;

    return { patientUserId, accessToken, BodyWeight_Unit, BodyWeight };
}

