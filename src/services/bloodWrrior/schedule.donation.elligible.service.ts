import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { NeedleService } from '../needle.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';

@scoped(Lifecycle.ContainerScoped)
export class ScheduleDonationElligibleService {

    constructor(
        @inject(dialoflowMessageFormatting) private _dialoflowMessageFormatting: dialoflowMessageFormatting,
        @inject(NeedleService) private needleService: NeedleService,
    ) {}

    async ScheduleDonationElligible (eventObj){
        return new Promise(async (resolve) => {
            try {
                const phoneNumber = eventObj.body.queryResult.parameters.phoneNumber;
                let result = null;
                let dffMessage = "";
                let payloadButtons = null;
                const apiURL = `donors/search?phone=${phoneNumber}&onlyElligible=true`;
                result = await this.needleService.needleRequestForREAN("get", apiURL);
                if (result.Data.Donors.Items.length === 0) {
                    dffMessage = `Based on our records, donor is not eligible to donate due to last donation date. Are you sure, the donor can donate?`;
                    payloadButtons = await whatsappMetaButtonService("Yes","Donor_Eligible","No","Volunteer_Confirm");
                    resolve( { fulfillmentMessages: [{ text: { text: [dffMessage] } }, payloadButtons]});
                } else {
                    resolve(this._dialoflowMessageFormatting.triggerIntent("Donor_Eligible",eventObj));
                }
    
            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'Schedule donation service error');
            }
        });
    }
    
}
