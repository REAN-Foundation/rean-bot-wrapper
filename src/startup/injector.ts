import 'reflect-metadata';
import type { DependencyContainer } from 'tsyringe';
import { AuthInjector } from '../auth/auth.injector.js';
import { WhatsappMetaMessageService } from '../services/whatsapp.meta.message.service.js';
import { WhatsappWatiMessageService } from '../services/whatsapp.wati.message.service.js';
import { WhatsappMessageService } from '../services/whatsapp.message.service.js';
import { TelegramMessageService as telegramPlatformservice } from '../services/telegram.message.service.js';
import { platformMessageService as rean_SUPPORT_Platformservice } from '../services/app.support.service.js';
import { snehaMessagePlatformService as sneha_SUPPORT_Platformservice } from '../services/sneha.support.service.js';
import { TelegramAuthenticator } from '../services/clientAuthenticator/telegram.authenticator.js';
import { WhatsappAuthenticator } from '../services/clientAuthenticator/whatsapp.authenticator.js';
import { WatiWhatsappAuthenticator } from '../services/clientAuthenticator/wati.whatsapp.authenticator.js';
import { ReanAppAuthenticator } from '../services/clientAuthenticator/reanapp.authenticator.js';
import { SlackAuthenticator } from '../services/clientAuthenticator/slack.authenticator.servie.js';
import { SlackMessageService } from '../services/slack.message.service.js';
import { WhatsappMetaAuthenticator } from '../services/clientAuthenticator/whatsapp.meta.authenticator.js';
import { MockMessageService } from '../services/mock.channel.js';
import { ClickUpMessageService } from '../services/clickup.message.service.js';
import { MockChannelAuthenticator } from '../services/clientAuthenticator/mockChannel.authenticator.js';
import { ClickUpAuthenticator } from '../services/clientAuthenticator/clickup.authenticator.js';
import { SnehaAuthenticator } from '../services/clientAuthenticator/sneha.authenticator.js';


export class Injector {

    static registerInjections(container: DependencyContainer) {

        //Auth
        AuthInjector.registerInjections(container);

        //client injector
        container.register('whatsapp', WhatsappMessageService);
        container.register('clickup', ClickUpMessageService);
        container.register('whatsappMeta', WhatsappMetaMessageService);
        container.register('whatsappWati', WhatsappWatiMessageService);
        container.register('telegram', telegramPlatformservice);
        container.register('REAN_SUPPORT', rean_SUPPORT_Platformservice);
        container.register('SNEHA_SUPPORT', sneha_SUPPORT_Platformservice);
        container.register('slack', SlackMessageService);
        container.register('telegram.authenticator', TelegramAuthenticator);
        container.register('anemiaTelegram.authenticator', TelegramAuthenticator);
        container.register('whatsapp.authenticator', WhatsappAuthenticator);
        container.register('REAN_SUPPORT.authenticator', ReanAppAuthenticator);
        container.register('SNEHA_SUPPORT.authenticator', SnehaAuthenticator);
        container.register('slack.authenticator', SlackAuthenticator);
        container.register('whatsappMeta.authenticator', WhatsappMetaAuthenticator);
        container.register('api', MockMessageService);
        container.register('clickup.authenticator', ClickUpAuthenticator);
        container.register('api.authenticator', MockChannelAuthenticator);
        container.register('whatsappWati.authenticator', WatiWhatsappAuthenticator);

    }

}
