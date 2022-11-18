import express from 'express';
import { Logger } from '../../common/logger';
import { injectable } from 'tsyringe';
import { ClientWebhookController } from '../controllers/client.webhook.controller';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { DatabaseConnection } from '../../middleware/database.connection.middleware';

@injectable()
export class PlatformWebhookRoutes{

    constructor(private logger?: Logger,
        private _clientWebhookController?: ClientWebhookController,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        private dbconnectioMiddleware?: DatabaseConnection){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();
        router.post(`/:client/:channel/:unique_token/send`, this.clientEnvironmentProviderService.clientNameMiddleware, this.dbconnectioMiddleware.myLogger, this._clientWebhookController.sendMessage);
        router.post(`/:client/:channel/:unique_token/receive`, this.clientEnvironmentProviderService.clientNameMiddleware, this.dbconnectioMiddleware.myLogger, this._clientWebhookController.receiveMessage);
        router.get(`/:client/:channel/:unique_token/webhook`, this.clientEnvironmentProviderService.clientNameMiddleware, this._clientWebhookController.authenticateMetaWhatsappWebhook);
        router.post(`/:client/:channel/:unique_token/webhook`, this.clientEnvironmentProviderService.clientNameMiddleware, this.dbconnectioMiddleware.metaDBConnection, this._clientWebhookController.receiveMessageMetaWhatsapp);
        // router.use();
        app.use('/v1/', router);
    }

}
