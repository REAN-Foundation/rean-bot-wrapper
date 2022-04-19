import { getHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import needle from "needle";

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

export const howDoFeelBetterInfoService = async (eventObj) => {

    if (eventObj) {
        const { patientUserId, apiUrl, options } = await getData(eventObj);
        const obj = {
            "PatientUserId" : patientUserId,
            "Feeling"       : 1,
            "RecordDate"    : Date()
        };
        const dffMessage = `Good to hear that.`;

        const data = await postData(apiUrl, obj, options, dffMessage);

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500,How do you feel better Info Service Error!`);
    }
};

export const howDoFeelSameInfoService = async (eventObj) => {

    if (eventObj) {
        const { patientUserId, apiUrl, options } = await getData(eventObj);

        const obj = {
            "PatientUserId" : patientUserId,
            "Feeling"       : 0,
            "RecordDate"    : Date()
        };
        const dffMessage = `Please follow your medications.`;

        const data = await postData(apiUrl, obj, options, dffMessage);

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500,How do you feel same Info Service Error!`);
    }
};

export const howDoFeelWorseInfoService = async (eventObj) => {

    if (eventObj) {
        const { patientUserId, apiUrl, options } = await getData(eventObj);

        const obj = {
            "PatientUserId" : patientUserId,
            "Feeling"       : -1,
            "RecordDate"    : Date()
        };
      
        const dffMessage = `Please tell me about your symptoms.`;
        
        const data = await postData(apiUrl, obj, options, dffMessage);

        return { sendDff: true, message: data };
    } else {
        throw new Error(`500,How do you feel worse Info Service Error!`);
    }
};

async function postData(apiUrl: string, obj: {
    PatientUserId: any; Feeling: number; RecordDate: string; }, options: any, dffMessage: string) {
    const response = await needle("post", apiUrl, obj, options);

    if (response.statusCode !== 201) {
        throw new Error("Failed to get response from API.");
    }

    return { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };
}

async function getData(eventObj: any) {
    const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
        ClientEnvironmentProviderService);

    // const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;

    // if (!phoneNumber) {
    //     throw new Error("Missing required parameter PhoneNumber ");
    // }
    let result = null;
    result = await getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);

    const patientUserId = result.message[0].UserId;

    const accessToken = result.message[0].accessToken;

    const options = getHeaders(accessToken);
    const ReanBackendBaseUrl = clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
    const apiUrl = `${ReanBackendBaseUrl}clinical/symptoms/how-do-you-feel`;
    return { patientUserId, apiUrl, options };
}

