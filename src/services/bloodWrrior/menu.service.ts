import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger.js';
import { dialoflowMessageFormatting } from '../Dialogflow.service.js';
import { BloodWarriorWelcomeService } from './welcome.service.js';
import { BloodWarriorCommonService } from './common.service.js';

@scoped(Lifecycle.ContainerScoped)
export class BloodWarriorMenuService {

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService: BloodWarriorCommonService,
        @inject(BloodWarriorWelcomeService) private bloodWarriorWelcomeService: BloodWarriorWelcomeService,
        @inject(dialoflowMessageFormatting) private dialogflowMessageFormattingService: dialoflowMessageFormatting
    ) {}

    async menuService (eventObj) {

        try {
            const roleId = await this.bloodWarriorWelcomeService.getRoleId(eventObj);
            let triggering_event = await this.getMenuEvent(roleId);
            if (triggering_event === "Donor_Confirm") {
                const donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);
                const donorType = donor.DonorType ?? null;
                triggering_event = donorType === "One time" ? "Donor_Confirm_Emergency" : "Donor_Confirm_Bridge";
            }
            return await this.dialogflowMessageFormattingService.triggerIntent(triggering_event,eventObj);

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
