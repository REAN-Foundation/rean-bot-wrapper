import express from 'express';
import { CommonController } from '../controllers/common.controller.js';
import { injectable } from 'tsyringe';

@injectable()
export class CommonRoutes {

    constructor(private commonController?: CommonController){
    }

    register (app: express.Application) {
        const router = express.Router();

        router.get('/ping', (_request, response) => {
            this.commonController.ping(_request,response);
        });

        // Index route
        router.get('/', (_request, response) => {
            response.send({ message: "ReanBot Webservice (V0.01)" });
        });

        // 404!
        router.use("*", (_request, response) => {
            response.status(404).send({ message: "404! Page Not Found." });
        });

        app.use('/api/common', router);
    }

}
