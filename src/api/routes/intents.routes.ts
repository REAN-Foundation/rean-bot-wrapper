import express from 'express';
import { Logger } from '../../common/logger';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { IntentsController } from '../controllers/intents.controller';


@scoped(Lifecycle.ContainerScoped)
export class IntentRoutes {

    constructor(
        private logger?: Logger,
        @inject(IntentsController)
            private _intentsController?: IntentsController
    ) {
        this.logger.log("Inside the intent routes");
    }

    register (app: express.Application) {
        const router = express.Router();
        router.get('/:client/intents', this._intentsController.getAll);
        router.get('/:client/intents/:id', this._intentsController.getById);
        router.post('/:client/intents/add', this._intentsController.create);
        router.put('/:client/intents/:id', this._intentsController.update);
        router.delete('/:client/intents/:id', this._intentsController.delete);

        app.use('/v1', router);
    }
}
