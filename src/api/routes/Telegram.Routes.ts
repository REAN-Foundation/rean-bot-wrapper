// import express from 'express';
// import { Logger } from '../../common/logger';
// import { injectable, inject } from 'tsyringe';
// // import { platformMessageService } from '../../services/TelegramMessage.Service';
// import { platformServiceInterface } from '../../Refactor/interface/PlatformInterface';
// import {container} from "tsyringe";
// import { WhatsappWebhookController } from '../controllers/WhatsappWebhook.Controller';

// @injectable()
// export class TelegramWebhookRoutes{
//     private _platformServiceInterface?: platformServiceInterface;

//     constructor(private logger?: Logger, private whatsappWebhookController?: WhatsappWebhookController ){
//         this.logger.log("Inside Telegram  Routes...");
//     }

//     register (app: express.Application) {
//         const router = express.Router();

//         router.post(`/:client/bot${process.env.TELEGRAM_BOT_TOKEN}`, this.whatsappWebhookController.receiveMessage);
//         // router.post('/receive', this.whatsappWebhookController.receiveMessage);


//         // router.post(`/:client/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
//         //     this._platformServiceInterface = container.resolve(req.params.client);

//         //     this._platformServiceInterface.handleMessage(req.body);
//         //     // this._platformMessageService.handleMessage(req.body)
//         //     console.log("Received the messege",req.body)
//         //     res.sendStatus(200);
//         // });

//         app.use(router);
//     }

// } 