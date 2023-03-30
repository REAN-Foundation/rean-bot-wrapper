import { GetHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from "../../services/support.app.service";
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped,  } from 'tsyringe';
import needle from "needle";

@scoped(Lifecycle.ContainerScoped)
export class HowDoYouFeelService {
    
    constructor(
        @inject(GetHeaders) private getHeaders: GetHeaders,
        @inject(GetPatientInfoService) private getPatientInfoService: GetPatientInfoService,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService
    ){}

    howDoFeelBetterInfoService = async (eventObj) => {

        if (eventObj) {
            const { patientUserId, apiUrl, options } = await this.getData(eventObj);
            const obj = {
                "PatientUserId" : patientUserId,
                "Feeling"       : 1,
                "RecordDate"    : Date()
            };
            const dffMessage = `Good to hear that.`;
    
            const data = await this.postData(apiUrl, obj, options, dffMessage);
    
            return { sendDff: true, message: data };
        } else {
            throw new Error(`500,How do you feel better Info Service Error!`);
        }
    };
    
    howDoFeelSameInfoService = async (eventObj) => {
    
        if (eventObj) {
            const { patientUserId, apiUrl, options } = await this.getData(eventObj);
    
            const obj = {
                "PatientUserId" : patientUserId,
                "Feeling"       : 0,
                "RecordDate"    : Date()
            };
            const dffMessage = `Please follow your medications.`;
    
            const data = await this.postData(apiUrl, obj, options, dffMessage);
    
            return { sendDff: true, message: data };
        } else {
            throw new Error(`500,How do you feel same Info Service Error!`);
        }
    };
    
    howDoFeelWorseInfoService = async (eventObj) => {
    
        if (eventObj) {
            const { patientUserId, apiUrl, options } = await this.getData(eventObj);
    
            const obj = {
                "PatientUserId" : patientUserId,
                "Feeling"       : -1,
                "RecordDate"    : Date()
            };
          
            const dffMessage = `Please tell me about your symptoms.`;
            
            const data = await this.postData(apiUrl, obj, options, dffMessage);
    
            return { sendDff: true, message: data };
        } else {
            throw new Error(`500,How do you feel worse Info Service Error!`);
        }
    };
    
    async postData(apiUrl: string, obj: {
        PatientUserId: any; Feeling: number; RecordDate: string; }, options: any, dffMessage: string) {
        const response = await needle("post", apiUrl, obj, options);
    
        if (response.statusCode !== 201) {
            throw new Error("Failed to get response from API.");
        }
    
        return { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }] };
    }
    
    async getData(eventObj: any) {
        let result = null;
        result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
    
        const patientUserId = result.message[0].UserId;
    
        const accessToken = result.message[0].accessToken;
    
        const options = this.getHeaders.getHeaders(accessToken);
        const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const apiUrl = `${ReanBackendBaseUrl}clinical/symptoms/how-do-you-feel`;
        return { patientUserId, apiUrl, options };
    }
    
}
