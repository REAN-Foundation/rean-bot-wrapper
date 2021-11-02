import express from 'express';
import { Logger } from '../../common/logger';
import { injectable } from 'tsyringe';
import { WhatsappWebhookController } from '../controllers/whatsapp.webhook.controller';

@injectable()
export class WhatsappWebhookRoutes{

    constructor(private logger?: Logger,
        private _whatsappWebhookController?: WhatsappWebhookController){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();

        router.post(`/:client/${process.env.TELEGRAM_BOT_TOKEN}/send`, this._whatsappWebhookController.sendMessage);
        router.post(`/:client/${process.env.TELEGRAM_BOT_TOKEN}/receive`, this._whatsappWebhookController.receiveMessage);

        app.use('/v1/', router);
    }

}
