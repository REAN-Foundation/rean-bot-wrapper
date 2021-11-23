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

        router.post(`/:client/${process.env.TELEGRAM_BOT_TOKEN}/send`, this._clientWebhookController.sendMessage);
        router.post(`/:client/${process.env.TELEGRAM_BOT_TOKEN}/receive`, this._clientWebhookController.receiveMessage);
        app.use('/v1/', router);
    }

}
