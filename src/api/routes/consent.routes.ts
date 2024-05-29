import express from 'express';
import { Logger } from '../../common/logger';
import { inject, Lifecycle, scoped } from 'tsyringe';
import {consentController} from '../controllers/consent.controller';

@scoped(Lifecycle.ContainerScoped)
export class ConsentRoutes{

    constructor(private logger?: Logger,
        @inject(consentController) private _consentController?: consentController
    ){
        this.logger.log("Inside whatsapp Routes...");
    }

    register (app: express.Application) {
        const router = express.Router();
        router.post(`/:client/consent/create`,this._consentController.recordConsentinfo);
        router.get(`/:client/consent/read`,this._consentController.readConsentinfo);
        router.put(`/:client/consent/update`,this._consentController.updateConsentinfo);
        router.delete(`/:client/consent/delete`,this._consentController.deleteConsentinfo);
        
        app.use('/v1/', router);
    }

}