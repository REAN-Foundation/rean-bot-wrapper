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

        router.get('/:client/chat-bot/ping', authenticator.authenticateUser, controller.ping);
        router.get('/:client/chat-bot/intent/validate', authenticator.authenticateUser, controller.validateIntent);
        router.post('/:client/chat-bot/intent/fulfill', authenticator.authenticateUser, controller.processIntent);
        router.post('/message/send', controller.sendWorkflowMessage);

        app.use('/v1', router);

    }

}
