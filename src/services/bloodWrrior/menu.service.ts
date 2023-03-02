import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { BloodWarriorWelcomeService } from './welcome.service';
import { BloodWarriorCommonService } from './common.service';

@autoInjectable()
export class BloodWarriorMenuService {

    welcomeService: BloodWarriorWelcomeService = container.resolve(BloodWarriorWelcomeService);

    dialoflowMessageFormattingService: dialoflowMessageFormatting = container.resolve(dialoflowMessageFormatting);

    bloodWarriorCommonService = new BloodWarriorCommonService();

    async menuService (eventObj) {
        try {
            const roleId = await this.welcomeService.getRoleId(eventObj);
            let triggering_event = await this.getMenuEvent(roleId);
            if (triggering_event === "Donor_Confirm") {
                const donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);
                const donorType = donor.DonorType ?? null;
                triggering_event = donorType === "One time" ? "Donor_Confirm_Emergency" : "Donor_Confirm_Bridge";
            }
            return await this.dialoflowMessageFormattingService.triggerIntent(triggering_event,eventObj);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Blood warrior menu service error');
        }
    }

    public getMenuEvent(roleId) {
        const message = {
            2  : "BloodWarrior_Patient",
            11 : "Donor_Confirm",
            1  : "Admin_Confirm",
            12 : "Volunteer_Confirm"
        };
        return message[roleId] ?? "New_User";
    }

}
