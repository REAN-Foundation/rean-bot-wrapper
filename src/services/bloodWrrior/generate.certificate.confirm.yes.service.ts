import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger.js';
import type { platformServiceInterface } from '../../refactor/interface/platform.interface.js';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service.js';
import { BloodWarriorCommonService } from './common.service.js';

@scoped(Lifecycle.ContainerScoped)
export class GenerateCertificateConfirmYesService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
    ) {}

    async sendUserMessage (eventObj) {
        try {
            const volunteer = await this.bloodWarriorCommonService.getVolunteerByPhoneNumber(eventObj);
            const dffMessage = `Thank you for your confirmation, ${volunteer.DisplayName}. \nThe donation is successfully rejected.

            Do you want to raise a donation request?`;
            const payloadButtons = await whatsappMetaButtonService("Yes","Schedule_Donation","No","Load_Volunteer_Reminder");
            return { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }, payloadButtons] } };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
        }
    }
}
