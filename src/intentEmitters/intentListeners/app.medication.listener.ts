import { GetPatientInfoService } from "../../services/support.app.service";
import { container } from 'tsyringe';
const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

export class AppMedicationListener {

    public static handleIntent = async (_intent, eventObj) => {
        try {

            const response = await getPatientInfoService.addMedicationInfoservice(eventObj);

            if (!response) {
                throw new Error('Add medication Info Listener Error!');
                
            }
            
            return response.message;
        } catch (error) {
            throw new Error(`Handle add medication intent ${error}`);
        }

    };

}
