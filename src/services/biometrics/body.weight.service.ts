import { GetHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import needle from "needle";

@scoped(Lifecycle.ContainerScoped)
export class BodyWeightService {

    constructor(
        @inject(GetHeaders) private getHeaders: GetHeaders,
        @inject(GetPatientInfoService) private getPatientInfoService: GetPatientInfoService,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService
    ){}

    updateBodyWeightInfoService = async (eventObj) => {

        if (eventObj) {
            var { patientUserId, accessToken, BodyWeight_Unit, BodyWeight } = await this.checkEntry(eventObj);

            const ReanBackendBaseUrl = process.env.REAN_APP_BACKEND_BASE_URL;
            const url = `${ReanBackendBaseUrl}clinical/biometrics/body-weights/search?patientUserId=${patientUserId}`;
            const options = this.getHeaders.getHeaders(accessToken);
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

            const dffMessage = `Your updated body weight is ${w} ${response.body.Data.BodyWeight.Unit}.`;

            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            return { sendDff: true, message: data };
        } else {
            throw new Error(`500, BodyWeightUpdate Info Service Error!`);
        }
    };

    createBodyWeightInfoService = async (eventObj) => {

        if (eventObj) {
            var { patientUserId, accessToken, BodyWeight_Unit, BodyWeight } = await this.checkEntry(eventObj);

            const ReanBackendBaseUrl = process.env.REAN_APP_BACKEND_BASE_URL;
            const options = this.getHeaders.getHeaders(accessToken);
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

            const dffMessage = `Your newly added body weight is ${w} ${response.body.Data.BodyWeight.Unit}.`;

            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            return { sendDff: true, message: data };
        } else {
            throw new Error(`500, BodyWeightCreate Info Service Error!`);
        }
    };

    async checkEntry(eventObj: any) {
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
        result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
        const patientUserId = result.message[0].UserId;
        const accessToken = result.message[0].accessToken;

        return { patientUserId, accessToken, BodyWeight_Unit, BodyWeight };
    }

}
