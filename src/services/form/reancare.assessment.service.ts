import { DependencyContainer, injectable } from "tsyringe";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import axios from "axios";

@injectable()
export class ReancareAssessmentService {
    
    private _clientEnvironmentProviderService: ClientEnvironmentProviderService;

    public submitAssessment = async (container: DependencyContainer, assessmentData: any) => {
        this._clientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
        console.log("this._clientEnvironmentProviderService", this._clientEnvironmentProviderService.getClientName());
        const baseURL = this._clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const apiURL = `${baseURL}clinical/assessments/${assessmentData.AssessmentTemplateId}/submit-at-once/whatsapp-form`;
        const options = this.getOptions();
        const response = await axios.post(apiURL, assessmentData, options);
        if (response.status !== 201 && response.status !== 200) {
            console.log("Failed to submit form", response.data);
            throw new Error("Failed to submit form");
        }
        return response.data;
    };

    private getOptions = () => {
        const apiKey = this._clientEnvironmentProviderService?.getClientEnvironmentVariable("REANCARE_API_KEY");
        return {
            headers : {
                "Content-Type" : "application/json",
                "x-api-key"    : apiKey
            }
        };
    };
    
}
