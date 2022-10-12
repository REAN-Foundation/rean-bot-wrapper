import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { BloodWarriorWelcomeService } from './welcome.service';

@autoInjectable()
export class BloodWarriorMenuService {

    welcomeService: BloodWarriorWelcomeService = container.resolve(BloodWarriorWelcomeService);

    dialoflowMessageFormattingService: dialoflowMessageFormatting = container.resolve(dialoflowMessageFormatting);
    
    async menuService (eventObj) {
        try {
            const roleId = await this.welcomeService.getRoleId(eventObj);
            const triggering_event = await this.getMenuEvent(roleId);
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
            1  : "Admin_Confirm"
        };
        return message[roleId] ?? "New_User";
    }

}
