import express from "express";

// import { register as registerUserRoutes } from "./user.routes";
// import { register as registerClientRoutes } from "./api.client.routes";
// import { register as registerAddressRoutes } from "./address.routes";
// import { register as registerPatientRoutes } from "./patient/patient.routes";
// import { register as registerDoctorRoutes } from "./doctor.routes";
// import { register as registerOrganizationRoutes } from './organization.routes';
// import { register as registerPersonRoutes } from './person.routes';
// import { register as registerTypesRoutes } from './types.routes';
// import { register as registerHealthProfileRoutes } from './patient/health.profile.routes';
import { Logger } from "../../common/logger";
import { ChatBotRoutes } from './chat-bot.routes';
import { autoInjectable } from 'tsyringe';
import { WhatsappWebhookRoutes } from './WhatsappWebhook.Routes';

////////////////////////////////////////////////////////////////////////////////////
@autoInjectable()
export class Router {

    private _app = null;

    constructor(app: express.Application, 
                private chatBotRoutes?: ChatBotRoutes,
                private whatsappWebhookRoutes?: WhatsappWebhookRoutes) {
        this._app = app;
    }

    public init = async (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            try {

                //Handling the base route
                this._app.get('/v1/', (req, res) => {
                    res.send({
                        message : `REANCare API [Version ${process.env.API_VERSION}]`,
                    });
                });

                this.chatBotRoutes.register(this._app);
                this.whatsappWebhookRoutes.register(this._app);
                // registerAddressRoutes(this._app);
                // registerClientRoutes(this._app);
                // registerPatientRoutes(this._app);
                // registerDoctorRoutes(this._app);
                // registerTypesRoutes(this._app);
                // registerPersonRoutes(this._app);
                // registerOrganizationRoutes(this._app);
                // registerHealthProfileRoutes(this._app);

                resolve(true);

            } catch (error) {
                Logger.instance().log('Error initializing the router: ' + error.message);
                reject(false);
            }
        });
    };

}
