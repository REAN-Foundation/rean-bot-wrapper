import express from 'express';
import { Logger } from '../../common/logger';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { SystemGeneratedMessagesController } from '../controllers/system.generated.messages.controller';


@scoped(Lifecycle.ContainerScoped)
export class SystemGeneratedMessagesRoutes {

    constructor(
        private logger?: Logger,
        @inject(SystemGeneratedMessagesController) 
            private _systemMessagesController?: SystemGeneratedMessagesController,
    ){
        this.logger.log("Inside the System Generated Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();
        router.get(`/:client/messages/`, this._systemMessagesController.getAll);
        router.get(`/:client/messages/:id`, this._systemMessagesController.getById);
        router.post(`/:client/messages/add`, this._systemMessagesController.create);
        router.put(`/:client/messages/:id`, this._systemMessagesController.update);
        router.delete(`/:client/messages/:id`, this._systemMessagesController.delete);

        app.use('/v1', router);
    }
}