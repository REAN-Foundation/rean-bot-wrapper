import { getHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

export const updateBodyHeightInfoService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService);
        var { patientUserId, accessToken, BodyHeight_Unit, BodyHeight } = await checkEntry(eventObj);
        
        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const url = `${ReanBackendBaseUrl}clinical/biometrics/body-heights/search?patientUserId=${patientUserId}`;
        const options = getHeaders(accessToken);
        const resp = await needle("get", url, options);
        const bodyHeightId = resp.body.Data.BodyHeightRecords.Items[0].id;

        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-heights/${bodyHeightId}`;

        const obj = {
            "PatientUserId" : patientUserId,
            "BodyHeight"    : BodyHeight,
            "Unit"          : BodyHeight_Unit
        };

        const response = await needle("put", apiUrl, obj, options);

        if (response.statusCode !== 200) {
            throw new Error("Failed to get response from API.");
        }
        const h = response.body.Data.BodyHeight.BodyHeight;

        const dffMessage = `Your updated BodyHeight is ${h} ${response.body.Data.BodyHeight.Unit}.`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BodyHeightUpdate Info Service Error!`);
    }
};

export const createBodyHeightInfoService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService);
        var { patientUserId, accessToken, BodyHeight_Unit, BodyHeight } = await checkEntry(eventObj);

        const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const options = getHeaders(accessToken);

        const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-heights`;
        const obj = {
            "PatientUserId" : patientUserId,
            "BodyHeight"    : BodyHeight,
            "Unit"          : BodyHeight_Unit,
            "RecordDate"    : Date()
        };

        const response = await needle("post", apiUrl, obj, options);

        if (response.statusCode !== 201) {
            throw new Error("Failed to get response from API.");
        }
        const h = response.body.Data.BodyHeight.BodyHeight;

        const dffMessage = `Your newly added BodyHeight is ${h} ${response.body.Data.BodyHeight.Unit}.`;

        const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, BodyHeightCreate Info Service Error!`);
    }
};

async function checkEntry(eventObj: any) {
    let BodyHeight = eventObj.body.queryResult.parameters.BodyHeight;
    let BodyHeight_Unit = eventObj.body.queryResult.parameters.BodyHeight_Unit;
    const Inch = eventObj.body.queryResult.parameters.Inch;

    const b = eventObj.body.session;
    const phoneNumber = b.split("/", 5)[4];

    const ten_digit = phoneNumber.substr(phoneNumber.length - 10);
    const country_code = phoneNumber.split(ten_digit)[0];

    if (BodyHeight_Unit === '') {
        if (country_code === '+91-') {
            BodyHeight_Unit = 'cm';
        } else if (country_code === '+1-') {
            BodyHeight_Unit = 'ft';
        }
    }
    if (Inch !== '') {
        BodyHeight = BodyHeight + (Inch / 12);
    }
    BodyHeight = Math.round(BodyHeight * 100) / 100;
    
    let result = null;
    result = await getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);

    const patientUserId = result.message[0].UserId;
    const accessToken = result.message[0].accessToken;

    return { patientUserId, accessToken, BodyHeight_Unit, BodyHeight };
}
