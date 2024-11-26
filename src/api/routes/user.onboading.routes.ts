import express from 'express';
import { Logger } from '../../common/logger';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { UserOnboadingController } from '../controllers/users.onboading.controller';

@scoped(Lifecycle.ContainerScoped)
export class UserOnboadingRoutes{

    constructor(private logger?: Logger,
        @inject(UserOnboadingController) private _userOnboadingController?: UserOnboadingController
    ){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();
        router.post(`/:client/userOnboading`, this. _userOnboadingController.onboadingProcess);
        app.use('/v1/', router);
    }

}
