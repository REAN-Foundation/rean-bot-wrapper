import express from 'express';
import { FrontendController } from '../controllers/Frontend.Controller';
import { inject, injectable, Lifecycle, scoped } from 'tsyringe';

@injectable()
@scoped(Lifecycle.ContainerScoped)
export class FrontendRoutes {

    constructor(@inject(FrontendController) private frontendController?: FrontendController){
    }

    register (app: express.Application) {
        const router = express.Router();

        router.get('/ping', (_request, response) => {
            this.frontendController.ping(_request,response);
        });

        router.get('/get_user_list', this.frontendController.getUserList);
        router.get('/get_conversation', this.frontendController.getConversation);

        app.use('/v1', router);
    }

}
