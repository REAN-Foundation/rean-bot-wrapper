import express from 'express';
import { Logger } from '../../common/logger';
import { injectable, inject } from 'tsyringe';
// import { platformServiceInterface } from '../../Refactor/interface/PlatformInterface';
import { WhatsappWebhookController } from '../controllers/WhatsappWebhook.Controller';

@injectable()
export class WhatsappWebhookRoutes{

    constructor(private logger?: Logger,
        // @inject('whatsapp') private _platformServiceInterface?: platformServiceInterface,
        private _whatsappWebhookController?: WhatsappWebhookController){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();

        router.post(`/:client/${process.env.TELEGRAM_BOT_TOKEN}/send`, this._whatsappWebhookController.sendMessage);
        // router.post('/receive', this._whatsappWebhookController.receiveMessage);
        router.post(`/:client/${process.env.TELEGRAM_BOT_TOKEN}/receive`, this._whatsappWebhookController.receiveMessage);

        // router.post('/send', this._platformServiceInterface.sendMessage);
        // router.post('/receive', this._platformServiceInterface.receiveMessage);

        app.use('/v1/', router);
    }

} 