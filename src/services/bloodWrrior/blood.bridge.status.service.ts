import { GetPatientInfoService } from '../support.app.service';
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { BloodWarriorWelcomeService } from './welcome.service';

@scoped(Lifecycle.ContainerScoped)
export class BloodBridgeStatusService {

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(BloodWarriorWelcomeService) private bloodWarriorWelcomeService?: BloodWarriorWelcomeService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    async bloodBridgeStatus (eventObj) {
        const getPatientInfoService: GetPatientInfoService = eventObj.container.resolve(GetPatientInfoService);

        try {
            const bridgeId = eventObj.body.queryResult.parameters.bridge_id;
            const apiURL = `clinical/patient-donors/search?name=${bridgeId}`;
            const roleId = await this.bloodWarriorWelcomeService.getRoleId(eventObj);
            let result = null;
            let dffMessage = null;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {
                const bloodBridge = result.Data.PatientDonors.Items[0];

                //check patient authorized to see the bridge information
                if (roleId === 2) {
                    let result = null;
                    result = await getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
                    const patientUserId = result.message[0].UserId;
                    if (bloodBridge.PatientUserId !== patientUserId) {
                        const msg = `Sorry, You don't have permission to access the information of bridge name ${bridgeId}.`;
                        return { message: { fulfillmentMessages: [{ text: { text: [msg] } }] } };
                    }
                }
                let lastDonationDate = bloodBridge.LastDonationDate ?? null;
                if (lastDonationDate) {
                    lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
                }
                let nextTrnasfusionDate = bloodBridge.NextDonationDate ?? null;
                if (nextTrnasfusionDate) {
                    nextTrnasfusionDate = new Date(nextTrnasfusionDate.split("T")[0]).toDateString();
                }
                dffMessage = `Here is the summary: \n
*Bridge Name:* ${bloodBridge.Name}
*Last Donation Date:* ${lastDonationDate}
*Next Transfusion Date:* ${nextTrnasfusionDate}
*Eligible Donors Count:* ${result.Data.PatientDonors.Items.length}
\n*Donors Signed up on Bridge:* ${result.Data.PatientDonors.Items.length} Out 10
*Parent Registered:* Yes`;

                if (eventObj.body.queryResult.intent.displayName === 'Donation_Request_BloodBridge') {
                    const volunteer = await this.bloodWarriorCommonService.getVolunteerByPhoneNumber(eventObj);
                    const apiURL = `volunteers/${volunteer.UserId}`;
                    const obj = {
                        SelectedBridgeId : bridgeId
                    };
                    await this.needleService.needleRequestForREAN("put", apiURL, null, obj);
                    const patient = await
                    this.bloodWarriorCommonService.getPatientPhoneByUserId(bloodBridge.PatientUserId);
                    const message = `\n*Patient Name:* ${patient.User.Person.DisplayName} \nDo you want to send a request to all eligible donors?`;
                    const buttons = await whatsappMetaButtonService("Yes", "Donation_Request_Yes","No", "Volunteer_Confirm");
                    return { message: { fulfillmentMessages: [{ text: { text: [dffMessage + message] } }, buttons] } };
                } else {
                    return { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
                }

            } else {
                dffMessage = "Error. Please re-enter \nIf problem continues, please contact the admin";
                return { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register donor with blood warrior service error');
        }
    }

}
