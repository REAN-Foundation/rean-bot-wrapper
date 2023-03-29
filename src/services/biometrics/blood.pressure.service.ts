import { GetHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import needle from "needle";

@scoped(Lifecycle.ContainerScoped)
export class BloodPressureService {

    constructor(
        @inject(GetHeaders) private getHeaders: GetHeaders,
        @inject(GetPatientInfoService) private getPatientInfoService: GetPatientInfoService,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService
    ){}

    getremark = (Systolic,Diastolic) => {
        let remark = '';
        if (Systolic <= 119 ){
            remark = 'in normal range. Stay healthy!';
            if (Diastolic < 60){
                remark = 'in low range. Please consult your Doctor.';
            } else if (Diastolic < 80){
                remark = 'in normal range. Stay healthy!';
            } else if (Diastolic >= 80 && Diastolic <= 89){
                remark = 'high blood pressure stage 1.';
            } else if (Diastolic >= 90 && Diastolic <= 120){
                remark = 'Stage 2';
            } else if (Diastolic > 120){
                remark = 'in hypertensive crisis. Please immediately consult your Doctor.';
            }
        } else if (Systolic >= 120 && Systolic <= 129 ){
            remark = 'in elevated range.';
            if (Diastolic < 80){
                remark = 'in elevated range.';
            } else if (Diastolic >= 80 && Diastolic <= 89){
                remark = 'high blood pressure stage 1.';
            } else if (Diastolic >= 90 && Diastolic <= 120){
                remark = 'high blood pressure stage 2. Please consult your Doctor.';
            } else if (Diastolic > 120){
                remark = 'in hypertensive crisis. Please immediately consult your Doctor.';
            }
        } else if (Systolic >= 130 && Systolic <= 139 ){
            remark = 'high blood pressure stage 1.';
            if (Diastolic >= 80 && Diastolic <= 89){
                remark = 'high blood pressure stage 1.';
            } else if (Diastolic >= 90 && Diastolic <= 120){
                remark = 'Stage 2';
            } else if (Diastolic > 120){
                remark = 'in hypertensive crisis. Please immediately consult your Doctor.';
            }
        } else if (Systolic >= 140 && Systolic <= 180 ){
            remark = 'Stage 2';
            if (Diastolic >= 90 && Diastolic <= 120){
                remark = 'Stage 2';
            } else if (Diastolic > 120){
                remark = 'in hypertensive crisis. Please immediately consult your Doctor.';
            }
        } else if (Systolic > 180 ){
            remark = 'in hypertensive crisis. Please immediately consult your Doctor.';
        }
        return remark;
    };

    updateBloodPressureInfoService = async (eventObj) => {

        if (eventObj) {
            // eslint-disable-next-line max-len
            var { patientUserId, accessToken, Systolic, Diastolic, BloodPressure_Unit } = await this.checkEntry(eventObj);
            const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");

            const url = `${ReanBackendBaseUrl}clinical/biometrics/blood-pressures/search?patientUserId=${patientUserId}`;
            
            const options = this.getHeaders.getHeaders(accessToken);
            const resp = await needle("get", url, options);
            const bloodPressureId = resp.body.Data.BloodPressureRecords.Items[0].id;

            let unitmsg = null;
            ({ unitmsg, BloodPressure_Unit } = this.getUnit(BloodPressure_Unit));
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

            const remark = this.getremark(Systolic,Diastolic);
            const dffMessage = `${unitmsg}Your updated blood pressure Systolic: ${s} Diastolic:${d} ${u} is ${remark}`;
            const data = { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };

            return { sendDff: true, message: data };
        } else {
            throw new Error(`500, BloodGlucoseUpdate Info Service Error!`);
        }
    };

    createBloodPressureInfoService = async (eventObj) => {

        if (eventObj) {
            // eslint-disable-next-line max-len
            var { patientUserId, accessToken, Systolic, Diastolic, BloodPressure_Unit } = await this.checkEntry(eventObj);

            let unitmsg = null;
            ({ unitmsg, BloodPressure_Unit } = this.getUnit(BloodPressure_Unit));
            const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
            const options = this.getHeaders.getHeaders(accessToken);
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
            const remark = this.getremark(Systolic,Diastolic);
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

    getUnit(BloodPressure_Unit: any) {
        let unitmsg = '';
        if (BloodPressure_Unit === '') {
            BloodPressure_Unit = 'mmHg';
            unitmsg = `BloodPressure unit assumed to mmHg. `;

        }
        return { unitmsg, BloodPressure_Unit };
    }

    async checkEntry(eventObj: any) {
        const Systolic = eventObj.body.queryResult.parameters.Systolic;
        const Diastolic = eventObj.body.queryResult.parameters.Diastolic;
        const BloodPressure_Unit = eventObj.body.queryResult.parameters.Unit;

        if (!Diastolic && !Systolic) {
            throw new Error("Missing required parameter Diastolic and/or Systolic");
        }
        let result = null;
        result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);

        const patientUserId = result.message[0].UserId;
        const accessToken = result.message[0].accessToken;

        return { patientUserId, accessToken, Systolic, Diastolic, BloodPressure_Unit };
    }

}
