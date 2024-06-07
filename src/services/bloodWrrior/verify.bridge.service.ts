import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { NeedleService } from '../needle.service';

@scoped(Lifecycle.ContainerScoped)
export class VerifyBridgeService {

    constructor(
        @inject(dialoflowMessageFormatting) private dialogflowMessageFormatingService?: dialoflowMessageFormatting,
        @inject(NeedleService) private needleService?: NeedleService
    ) {}

    async VerifyBridge(eventObj) {
        try {
            const bridgeId = eventObj.body.queryResult.parameters.bridge_Id;
            let result = null;
            let dffMessage = "";
            const apiURL = `clinical/patient-donors/search?name=${bridgeId}&onlyElligible=true`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {
                return this.dialogflowMessageFormatingService.triggerIntent("Blood_Bridge_Verify_Take_Values",eventObj);
            } else {
                dffMessage = `Invalid Bridge ID - Please enter again`;
                return { fulfillmentMessages: [{ text: { text: [dffMessage] } }] };
            }
    
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Schedule donation service error');
        }
    }
}
