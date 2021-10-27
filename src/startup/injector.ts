import 'reflect-metadata';
import { DependencyContainer } from 'tsyringe';

// import { DatabaseInjector } from "../database/database.injector";
// import { ModuleInjector } from '../modules/module.injector';
import { AuthInjector } from '../auth/auth.injector';
import { platformMessageService } from '../services/whatsapp-message.service';
import { platformMessageService as telegramPlatformservice} from '../services/TelegramMessage.Service';
import { platformMessageService as rean_SUPPORT_Platformservice} from '../services/AppSupport.Service';
//////////////////////////////////////////////////////////////////////////////////////////////////

export class Injector {

    static registerInjections(container: DependencyContainer) {

        //Auth
        AuthInjector.registerInjections(container);

        //client injector
        container.register('whatsapp', platformMessageService);
        container.register('telegram', telegramPlatformservice);
        container.register('REAN_SUPPORT', rean_SUPPORT_Platformservice);


        //Database
        // DatabaseInjector.registerInjections(container);

        //Modules
        // ModuleInjector.registerInjections(container);

    }

}
