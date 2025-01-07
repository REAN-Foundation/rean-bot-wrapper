// import { scoped, Lifecycle, inject } from 'tsyringe';
// import needle from "needle";
// import { Logger } from '../../../common/logger';
// import { platformServiceInterface } from '../../../refactor/interface/platform.interface';
// import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
// import { CustomModelResponseFormat } from "../../../services/response.format/custom.model.response.format";
// import { SetReminderService } from '../../../services/reminder/general.reminder.service';

// @scoped(Lifecycle.ContainerScoped)
// export class AppointmentUserReplyService {

//     private _platformMessageService :  platformServiceInterface = null;

//     constructor(
//         // eslint-disable-next-line max-len
//         @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
//         @inject(SetReminderService) private setReminderService?: SetReminderService

//     ){}

//     async checkVerticle(customModelResponseFormat: CustomModelResponseFormat){
//         const verticle = customModelResponseFormat.getVerticle();

//         const classMap: { [key: string]: any } = {
//             setReminderService: this.setReminderService,

//         };

//         const instance = Object.values(classMap).find(instance => instance && typeof instance[verticle[0]] === 'function');
//         // for (const instance of Object.values(classMap)) {
//         //     if (instance && typeof instance[verticle[0]] === 'function') {
//         //         return instance[verticle[0]]();
//         //     }
//         // }

//         if (instance) {
//             return instance[verticle[0]]();
//         } else {
//             throw new Error(`Method ${verticle[0]} does not exist on either A or B`);
//         }
//     }

// }
