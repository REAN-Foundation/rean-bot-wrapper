import { GetHeaders } from '../../services/biometrics/get.headers.js';
import { GetPatientInfoService } from "../../services/support.app.service.js";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service.js';
import { inject, Lifecycle, scoped } from 'tsyringe';
import needle from "needle";

@scoped(Lifecycle.ContainerScoped)
export class BodyTemperatureService {

    constructor(
        @inject(GetHeaders) private getHeaders: GetHeaders,
        @inject(GetPatientInfoService) private getPatientInfoService: GetPatientInfoService,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService
    ){}

    getremark = (BodyTemperature_Unit,BodyTemperature) => {
        let remark = '';
        if (BodyTemperature_Unit === '°F') {
            if (BodyTemperature < 95) {
                remark = 'in low range.';
            } else if (BodyTemperature < 99 && BodyTemperature > 95) {
                remark = 'in normal range. Stay healthy!';
            } else if (BodyTemperature < 100 && BodyTemperature >= 99) {
                remark = 'mild fever.';
            } else if (BodyTemperature < 102 && BodyTemperature >= 100) {
                remark = 'high. Please consult your Doctor.';
            } else if (BodyTemperature >= 102) {
                remark = 'very high. Please consult your Doctor.';
            }
        }
        this.checkForC(BodyTemperature_Unit, BodyTemperature);
        return remark;
    };

    updateBodyTemperatureInfoService = async (eventObj) => {

        if (eventObj) {
            var { patientUserId, accessToken, BodyTemperature_Unit, BodyTemperature } = await this.checkEntry(eventObj);

            const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
            const url = `${ReanBackendBaseUrl}clinical/biometrics/body-temperatures/search?patientUserId=${patientUserId}`;

            const options = this.getHeaders.getHeaders(accessToken);
            const resp = await needle("get", url, options);
            const bodyTemperatureId = resp.body.Data.BodyTemperatureRecords.Items[0].id;
            let unitmsg = null;
            ({ unitmsg, BodyTemperature_Unit } = this.getUnit(BodyTemperature_Unit,BodyTemperature));
            const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-temperatures/${bodyTemperatureId}`;

            const obj = {
                "PatientUserId"   : patientUserId,
                "BodyTemperature" : BodyTemperature,
                "Unit"            : BodyTemperature_Unit
            };

            const response = await needle("put", apiUrl, obj, options);

            if (response.statusCode !== 200) {
                throw new Error("Failed to get response from API.");
            }
            const remark = this.getremark(BodyTemperature_Unit,BodyTemperature);
            const t = response.body.Data.BodyTemperature.BodyTemperature;
            const u = response.body.Data.BodyTemperature.Unit;

            const dffMessage = `${unitmsg}Your updated body temperature ${t} ${u} is ${remark}`;

            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            return { sendDff: true, message: data };
        } else {
            throw new Error(`500, BodyTemperatureUpdate Info Service Error!`);
        }
    };

    createBodyTemperatureInfoService = async (eventObj) => {

        if (eventObj) {
            var { patientUserId, accessToken, BodyTemperature_Unit, BodyTemperature } = await this.checkEntry(eventObj);

            let unitmsg = null;
            ({ unitmsg, BodyTemperature_Unit } = this.getUnit(BodyTemperature_Unit,BodyTemperature));
            const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
            const options = this.getHeaders.getHeaders(accessToken);
            const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/body-temperatures`;

            const obj = {
                "PatientUserId"   : patientUserId,
                "BodyTemperature" : BodyTemperature,
                "Unit"            : BodyTemperature_Unit,
                "RecordDate"      : Date()
            };

            const response = await needle("post", apiUrl, obj, options);

            if (response.statusCode !== 201) {
                throw new Error("Failed to get response from API.");
            }
            const remark = this.getremark(BodyTemperature_Unit,BodyTemperature);
            const t = response.body.Data.BodyTemperature.BodyTemperature;
            const u = response.body.Data.BodyTemperature.Unit;

            const dffMessage = `${unitmsg}Your newly added body temperature ${t} ${u} is ${remark}`;

            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            return { sendDff: true, message: data };
        } else {
            throw new Error(`500, BodyTemperatureCreate Info Service Error!`);
        }
    };

    getUnit(BodyTemperature_Unit: any, BodyTemperature: any) {
        let unitmsg = '';
        if (BodyTemperature_Unit === '') {

            if (BodyTemperature < 50) {
                BodyTemperature_Unit = '°C';
                unitmsg = `Temperature unit assumed to °C. `;
            } else {
                BodyTemperature_Unit = '°F';
                unitmsg = `Temperature unit assumed to °F. `;
            }

        }
        return { unitmsg, BodyTemperature_Unit };
    }

    async checkEntry(eventObj: any) {
        const BodyTemperature = eventObj.body.queryResult.parameters.BodyTemperature;
        const BodyTemperature_Unit = eventObj.body.queryResult.parameters.Unit;

        if (!BodyTemperature) {
            throw new Error("Missing required parameter BodyTemperature");
        }
        let result = null;
        result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);

        const patientUserId = result.message[0].UserId;

        const accessToken = result.message[0].accessToken;
        return { patientUserId, accessToken, BodyTemperature_Unit, BodyTemperature };
    }

    checkForC(BodyTemperature_Unit: any, BodyTemperature: any) {
        let remark = '';
        if (BodyTemperature_Unit === '°C') {
            if (BodyTemperature < 37) {
                remark = 'in low range.';
            } else if (BodyTemperature <= 38) {
                remark = 'in normal range. Stay healthy!';
            } else if (BodyTemperature < 39) {
                remark = 'mild fever.';
            } else if (BodyTemperature < 42) {
                remark = 'very high. Please consult your Doctor.';
            }
        }
        return remark;
    }
}

