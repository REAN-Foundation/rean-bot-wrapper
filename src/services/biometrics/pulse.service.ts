import { GetHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import needle from "needle";

@scoped(Lifecycle.ContainerScoped)
export class PulseService {

    constructor(
        @inject(GetHeaders) private getHeaders: GetHeaders,
        @inject(GetPatientInfoService) private getPatientInfoService: GetPatientInfoService,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService
    ){}

    getremark = (Pulse) => {
        let remark = '';
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

    updatePulseInfoService = async (eventObj) => {

        if (eventObj) {
            var { patientUserId, accessToken, Pulse_Unit, Pulse } = await this.checkEntry(eventObj);

            const ReanBackendBaseUrl = process.env.REAN_APP_BACKEND_BASE_URL;
            const url = `${ReanBackendBaseUrl}clinical/biometrics/pulse/search?patientUserId=${patientUserId}`;

            const options = this.getHeaders.getHeaders(accessToken);
            const resp = await needle("get", url, options);
            const pulseId = resp.body.Data.PulseRecords.Items[0].id;

            const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/Pulse/${pulseId}`;

            const obj = {
                "PatientUserId" : patientUserId,
                "Pulse"         : Pulse,
                "Unit"          : Pulse_Unit
            };

            const response = await needle("put", apiUrl, obj, options);

            if (response.statusCode !== 200) {
                throw new Error("Failed to get response from API.");
            }
            const remark = this.getremark(Pulse);
            const p = response.body.Data.Pulse.Pulse;

            const dffMessage = `Your updated pulse rate ${p} ${response.body.Data.Pulse.Unit} is ${remark}`;

            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            return { sendDff: true, message: data };
        } else {
            throw new Error(`500, PulseUpdate Info Service Error!`);
        }
    };

    createPulseInfoService = async (eventObj) => {

        if (eventObj) {
            var { patientUserId, accessToken, Pulse_Unit, Pulse } = await this.checkEntry(eventObj);

            const ReanBackendBaseUrl = process.env.REAN_APP_BACKEND_BASE_URL;
            const options = this.getHeaders.getHeaders(accessToken);
            const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/Pulse`;

            const obj = {
                "PatientUserId" : patientUserId,
                "Pulse"         : Pulse,
                "Unit"          : Pulse_Unit,
                "RecordDate"    : Date()
            };

            const response = await needle("post", apiUrl, obj, options);

            if (response.statusCode !== 201) {
                throw new Error("Failed to get response from API.");
            }
            const remark = this.getremark(Pulse);
            const p = response.body.Data.Pulse.Pulse;

            const dffMessage = `Your newly added pulse rate ${p} ${response.body.Data.Pulse.Unit} is ${remark}`;

            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            return { sendDff: true, message: data };
        } else {
            throw new Error(`500, PulseCreate Info Service Error!`);
        }
    };

    async checkEntry(eventObj: any) {
        const Pulse = eventObj.body.queryResult.parameters.Pulse;
        let Pulse_Unit = eventObj.body.queryResult.parameters.Pulse_Unit;

        if (Pulse_Unit === '') {
            Pulse_Unit = 'bpm';
        }

        if (!Pulse) {
            throw new Error("Missing required parameter pulse");
        }
        let result = null;
        result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);

        const patientUserId = result.message[0].UserId;

        const accessToken = result.message[0].accessToken;
        return { patientUserId, accessToken, Pulse_Unit, Pulse };
    }

}
