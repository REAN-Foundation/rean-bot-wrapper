import express from 'express';
import { Logger } from '../../common/logger';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientWebhookController } from '../controllers/client.webhook.controller';
import { kobotoolboxController } from '../controllers/kobotoolbox.controller';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { DatabaseConnection } from '../../middleware/database.connection.middleware';

@scoped(Lifecycle.ContainerScoped)
export class PlatformWebhookRoutes{

    constructor(private logger?: Logger,
        @inject(ClientWebhookController) private _clientWebhookController?: ClientWebhookController,
        @inject(kobotoolboxController) private _kobotoolboxController?: kobotoolboxController,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(DatabaseConnection) private dbconnectioMiddleware?: DatabaseConnection){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();
        router.post(`/:client/:channel/:unique_token/send`, this.dbconnectioMiddleware.myLogger, this._clientWebhookController.sendMessage);
        router.post(`/:client/:channel/:unique_token/receive`, this.dbconnectioMiddleware.myLogger, this._clientWebhookController.receiveMessage);
        router.get(`/:client/:channel/:unique_token/webhook`, this._clientWebhookController.authenticateMetaWhatsappWebhook);
        router.post(`/:client/:channel/:unique_token/webhook`, this.dbconnectioMiddleware.metaDBConnection, this._clientWebhookController.receiveMessageMetaWhatsapp);
        router.post(`/:client/:form_name/kobotoolbox/abcd/getData`, this._kobotoolboxController.kobotoolbox );
        app.use('/v1/', router);
    }

}
