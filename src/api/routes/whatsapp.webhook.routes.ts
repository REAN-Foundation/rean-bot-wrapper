import express from 'express';
import { Logger } from '../../common/logger';
import { injectable } from 'tsyringe';
import { ClientWebhookController } from '../controllers/client.webhook.controller';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';

@injectable()
export class WhatsappWebhookRoutes{

    constructor(private logger?: Logger,
        private _clientWebhookController?: ClientWebhookController,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();

        router.post(`/:client/:channel/:unique_token/send`, this.clientEnvironmentProviderService.clientNameMiddleware, this._clientWebhookController.sendMessage);
        router.post(`/:client/:channel/:unique_token/receive`, this.clientEnvironmentProviderService.clientNameMiddleware, this._clientWebhookController.receiveMessage);
        app.use('/v1/', router);
    }

}
