import express from 'express';
import { Logger } from '../../common/logger';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { StatsController } from '../controllers/stats.controller';
import { Loader } from '../../startup/loader';

@scoped(Lifecycle.ContainerScoped)
export class StatsRoutes {

    constructor(
        private logger?: Logger,
        @inject(StatsController)
            private _statsController?: StatsController
    ) {
        this.logger.log("Inside the stats routes");
    }

    register (app: express.Application) {
        const router = express.Router();

        const authenticator = Loader.authenticator;

        router.get('/:client/stats/daily-series', authenticator.authenticateClient, this._statsController.getDailySeries);
        router.get('/:client/stats/content-frequency', authenticator.authenticateClient, this._statsController.getContentFrequency);
        router.get('/:client/stats/lifetime', authenticator.authenticateClient, this._statsController.getLifetimeStats);

        app.use('/v1', router);
    }

}
