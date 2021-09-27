import express from 'express';
import { WhatsappWebhookController } from '../controllers/WhatsappWebhook.Controller';
import { Logger } from '../../common/logger';
import { injectable } from 'tsyringe';

@injectable()
export class WhatsappWebhookRoutes{

    constructor(private logger?: Logger,
                private whatsappWebhookController?:WhatsappWebhookController){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();

        router.post('/send', this.whatsappWebhookController.sendMessage);
        router.post('/receive', this.whatsappWebhookController.receiveMessage);

        app.use('/v1/whatsapp', router);
    }

} 