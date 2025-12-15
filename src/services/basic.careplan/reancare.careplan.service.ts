import { DependencyContainer, injectable } from "tsyringe";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import axios from "axios";
import { CareplanEnrollmentDomainModel } from "../../domain.types/basic.careplan/careplan.types";

@injectable()
export class ReancareCareplanService {
    
    private _clientEnvironmentProviderService: ClientEnvironmentProviderService;

    public EnrollCareplan =
    async (container: DependencyContainer, patientUserId: string, model: CareplanEnrollmentDomainModel) => {
        this._clientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
        console.log("this._clientEnvironmentProviderService", this._clientEnvironmentProviderService.getClientName());
        const baseURL = this._clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");
        const apiURL = `${baseURL}care-plans/patients/${patientUserId}/enroll`;
        const options = this.getOptions();
        const response = await axios.post(apiURL, model, options);
        if (response.status !== 201 && response.status !== 200) {
            console.log("Error in careplan enrollment", response.data);
            throw new Error(response.data?.Message || "Error in careplan enrollment");
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
