import express from 'express';
import { Logger } from '../../common/logger';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { UserRegistrationController } from '../controllers/users.registeration.controller';

@scoped(Lifecycle.ContainerScoped)
export class UserRegistrationRoutes{

    constructor(private logger?: Logger,
        @inject(UserRegistrationController) private _userRegistrationController?: UserRegistrationController
    ){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();
        router.post(`/:client`, this._userRegistrationController.register);
        router.post(`/:client/maternity/careplans/enrollments/:careplanId`,this._userRegistrationController.enrollToCareplan);
        router.delete(`/:client/maternity/careplans/enrollments/:careplanId`,this._userRegistrationController.unenrollFromCareplan);
        app.use('/v1/', router);
    }

}
