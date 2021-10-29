import 'reflect-metadata';
import { DependencyContainer } from 'tsyringe';
import { AuthInjector } from '../auth/auth.injector';
import { platformMessageService } from '../services/whatsapp.message.service';
import { platformMessageService as telegramPlatformservice} from '../services/telegram.message.service';
import { platformMessageService as rean_SUPPORT_Platformservice} from '../services/app.support.service';

export class Injector {

    static registerInjections(container: DependencyContainer) {

        //Auth
        AuthInjector.registerInjections(container);

        //client injector
        container.register('whatsapp', platformMessageService);
        container.register('telegram', telegramPlatformservice);
        container.register('REAN_SUPPORT', rean_SUPPORT_Platformservice);

    }

}
