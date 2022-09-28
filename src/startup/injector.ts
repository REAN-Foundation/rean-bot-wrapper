import 'reflect-metadata';
import { DependencyContainer } from 'tsyringe';
import { AuthInjector } from '../auth/auth.injector';
import { WhatsappMetaMessageService } from '../services/whatsapp.meta.message.service';
import { WhatsappMessageService } from '../services/whatsapp.message.service';
import { TelegramMessageService as telegramPlatformservice } from '../services/telegram.message.service';
import { platformMessageService as rean_SUPPORT_Platformservice } from '../services/app.support.service';
import { TelegramAuthenticator } from '../services/clientAuthenticator/telegram.authenticator';
import { WhatsappAuthenticator } from '../services/clientAuthenticator/whatsapp.authenticator';
import { ReanAppAuthenticator } from '../services/clientAuthenticator/reanapp.authenticator';
import { SlackAuthenticator } from '../services/clientAuthenticator/slack.authenticator.servie';
import { SlackMessageService } from '../services/slack.message.service';
import { WhatsappMetaAuthenticator } from '../services/clientAuthenticator/whatsapp.meta.authenticator';
import { MockMessageService } from '../services/mock.channel';
import { ClickUpMessageService } from '../services/clickup.message.service';
import { MockChannelAuthenticator } from '../services/clientAuthenticator/mockChannel.authenticator';
import { ClickUpAuthenticator } from '../services/clientAuthenticator/clickup.authenticator';


export class Injector {

    static registerInjections(container: DependencyContainer) {

        //Auth
        AuthInjector.registerInjections(container);

        //client injector
        container.register('whatsapp', WhatsappMessageService);
        container.register('clickup', ClickUpMessageService);
        container.register('whatsappMeta', WhatsappMetaMessageService);
        container.register('telegram', telegramPlatformservice);
        container.register('REAN_SUPPORT', rean_SUPPORT_Platformservice);
        container.register('slack', SlackMessageService);
        container.register('telegram.authenticator', TelegramAuthenticator);
        container.register('anemiaTelegram.authenticator', TelegramAuthenticator);
        container.register('whatsapp.authenticator', WhatsappAuthenticator);
        container.register('REAN_SUPPORT.authenticator', ReanAppAuthenticator);
        container.register('slack.authenticator', SlackAuthenticator);
        container.register('whatsappMeta.authenticator', WhatsappMetaAuthenticator);
        container.register('mockChannel', MockMessageService);
        container.register('clickup.authenticator', ClickUpAuthenticator);
        container.register('mockChannel.authenticator', MockChannelAuthenticator);

    }

}
