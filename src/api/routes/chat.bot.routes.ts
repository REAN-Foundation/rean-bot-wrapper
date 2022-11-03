/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';

import { Loader } from '../../startup/loader';
import { ChatBotController } from '../controllers/chat.bot.controller';
import { injectable } from 'tsyringe';

@injectable()
export class ChatBotRoutes {

    register (app: express.Application): void {

        const router = express.Router();

        const authenticator = Loader.authenticator;
        const controller = new ChatBotController();

        router.get('/ping', authenticator.authenticateUser, controller.ping);
        router.get('/intent/validate', authenticator.authenticateUser, controller.validateIntent);
        router.post('/intent/fulfill', authenticator.authenticateUser, controller.processIntent);
        app.use('/v1/chat-bot', router);

    }

}
