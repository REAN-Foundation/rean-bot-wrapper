import express from 'express';
import { Logger } from '../../common/logger';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { StatsController } from '../controllers/stats.controller';
import { CustomStatsController } from '../controllers/custom.stats.controller';
import { Loader } from '../../startup/loader';

@scoped(Lifecycle.ContainerScoped)
export class StatsRoutes {

    constructor(
        private logger?: Logger,
        @inject(StatsController)
            private _statsController?: StatsController,
        @inject(CustomStatsController)
            private _customStatsController?: CustomStatsController
    ) {
        this.logger.log("Inside the stats routes");
    }

    register (app: express.Application) {
        const router = express.Router();

        const authenticator = Loader.authenticator;

        router.get('/:client/stats/daily-series', authenticator.authenticateClient, this._statsController.getDailySeries);
        router.get('/:client/stats/content-frequency', authenticator.authenticateClient, this._statsController.getContentFrequency);
        router.get('/:client/stats/lifetime', authenticator.authenticateClient, this._statsController.getLifetimeStats);

        const custom = this._customStatsController;
        router.get('/:client/stats/custom/summary', authenticator.authenticateClient, custom.requireCustomStats, custom.getSummary);
        router.get('/:client/stats/custom/users', authenticator.authenticateClient, custom.requireCustomStats, custom.getUsers);
        router.post('/:client/stats/custom/backfill', authenticator.authenticateClient, custom.requireCustomStats, custom.backfill);

        app.use('/v1', router);
    }

}
