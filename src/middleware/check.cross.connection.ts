import express from "express";
import { ClientEnvironmentProviderService } from "../services/set.client/client.environment.provider.service";
import { ResponseHandler } from '../utils/response.handler';

export class CheckCrossConnection {

    private _app: express.Application = null;

    constructor(app: express.Application,private responseHandler?: ResponseHandler,
        private clientEnvironment?: ClientEnvironmentProviderService) {
        this._app = app;
    }

    checkCrossConnection(): void {
        this._app.use((req, res, next) => {
            const phone_number_id = this.clientEnvironment.getClientEnvironmentVariable('WHATSAPP_PHONE_NUMBER_ID');
            if (req.body.entry[0].changes[0].value.metadata.phone_number_id !== phone_number_id){
                this.responseHandler.sendSuccessResponse(res, 200, 'Cross Connection', "");
                console.log("Cross connection");
            }
            else {
                console.log("No cross connection");
                next();
            }
        });
    }
}
