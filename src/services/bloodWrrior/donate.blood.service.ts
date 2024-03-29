import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { BloodWarriorCommonService } from './common.service';
import { BloodWarriorWelcomeService } from './welcome.service';

@scoped(Lifecycle.ContainerScoped)
export class DonateBloodService {

    constructor(
        @inject(BloodWarriorWelcomeService) private bloodWarriorWelcomeService?: BloodWarriorWelcomeService,
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService
    ){}

    async DonateBlood(eventObj){
        try {
            const roleId = await this.bloodWarriorWelcomeService.getRoleId(eventObj);
            let user = null;
            if (roleId === 11) {
                user = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);
            } else if (roleId === 12) {
                user = await this.bloodWarriorCommonService.getVolunteerByPhoneNumber(eventObj);
            }
            if (user.LastDonationDate !== null || undefined) {
                const lastDonationDate = new Date(user.LastDonationDate.split("T")[0]).toDateString();
                const d = new Date(`${user.LastDonationDate.split("T")[0]}`);
                d.setDate(d.getDate() + 90);
                const stringDate = new Date(d).toDateString();
                const dffMessage = `You are eligible to donate after ${stringDate} \n    *Last Donation Date:* ${lastDonationDate}\n    *Donations Till Date:* 1
                \nSomeone from Blood Warriors Team will contact you soon. \n    You are a superhero.`;
                return { fulfillmentMessages: [{ text: { text: [dffMessage] } } ] };
            } else {
                const dffMessage = `No history of donations found.\n \nWola! that's not a bad news at all. You can register as a donor and donate blood.`;
                const buttons = await whatsappMetaButtonService("Register as a Donor", "Register_Donor","Go back to Menu", "Home_Menu");
                return { fulfillmentMessages: [{ text: { text: [dffMessage] } }, buttons ] };
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Donate blood service error');
        }
    }
    
}
