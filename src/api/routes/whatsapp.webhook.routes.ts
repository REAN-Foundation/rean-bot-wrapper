import express from 'express';
import { Logger } from '../../common/logger';
import { injectable } from 'tsyringe';
import { ClientWebhookController } from '../controllers/client.webhook.controller';

@injectable()
export class WhatsappWebhookRoutes{

    constructor(private logger?: Logger,
        private _clientWebhookController?: ClientWebhookController){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();

        router.post(`/:client/:unique_token/send`, this._clientWebhookController.sendMessage);
        router.post(`/:client/:unique_token/receive`, this._clientWebhookController.receiveMessage);
        app.use('/v1/', router);
    }

}
