import express from 'express';
import { Logger } from '../../common/logger';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientWebhookController } from '../controllers/client.webhook.controller';
import { kobotoolboxController } from '../controllers/kobotoolbox.controller';

@scoped(Lifecycle.ContainerScoped)
export class PlatformWebhookRoutes{

    constructor(private logger?: Logger,
        @inject(ClientWebhookController) private _clientWebhookController?: ClientWebhookController,
        @inject(kobotoolboxController) private _kobotoolboxController?: kobotoolboxController
    ){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();
        router.post(`/:client/:channel/:unique_token/send`, this._clientWebhookController.sendMessage);
        router.post(`/:client/:channel/:unique_token/receive`, this._clientWebhookController.receiveMessage);
        router.post(`/:client/:channel/receive`, this._clientWebhookController.receiveMessage);
        router.get(`/:client/:channel/:unique_token/webhook`, this._clientWebhookController.authenticateMetaWhatsappWebhook);
        router.post(`/:client/:channel/:unique_token/webhook`, this._clientWebhookController.receiveMessageMetaWhatsapp);
        router.post(`/:client/:form_name/kobotoolbox/abcd/getData`, this._kobotoolboxController.kobotoolbox );
        router.post(`/:client/:channel/:unique_token/watiwebhook`, this._clientWebhookController.receiveMessageWatiWhatsapp);
        app.use('/v1/', router);
    }

}
