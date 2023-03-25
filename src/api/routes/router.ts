import express from "express";
import { Logger } from "../../common/logger";
import { ChatBotRoutes } from './chat.bot.routes';
import { autoInjectable } from 'tsyringe';
import { PlatformWebhookRoutes } from './platform.webhook.routes';
import { FrontendRoutes } from "./Frontend.routes";

// import { ClientEnvironmentProviderService } from "../../services/set.client/client.environment.provider.service";

@autoInjectable()
export class Router {

    private _app: express.Application = null;

    constructor(app: express.Application,
                private chatBotRoutes?: ChatBotRoutes,
                private whatsappWebhookRoutes?: PlatformWebhookRoutes,
                private frontendRoutes?: FrontendRoutes,){
        this._app = app;
    }

    public init = async (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            try {
                console.log("Inside router.ts");
                this._app.get('/v1/', (req, res) => {
                    res.send({
                        message : `REANCare API [Version]`,
                    });
                });

                this.chatBotRoutes.register(this._app);
                this.whatsappWebhookRoutes.register(this._app);
                this.frontendRoutes.register(this._app);
                resolve(true);

            } catch (error) {
                Logger.instance().log('Error initializing the router: ' + error.message);
                reject(false);
            }
        });
    };

}
