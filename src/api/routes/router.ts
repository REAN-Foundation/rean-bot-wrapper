import express from "express";
import { Logger } from "../../common/logger.js";
import { ChatBotRoutes } from './chat.bot.routes.js';
import { autoInjectable } from 'tsyringe';
import { PlatformWebhookRoutes } from './platform.webhook.routes.js';
import { SystemGeneratedMessagesRoutes } from "./system.generated.messages.routes.js";
import { IntentRoutes } from "./intents.routes.js";
import { FrontendRoutes } from "./Frontend.routes.js";
import { ConsentRoutes } from "./consent.routes.js";
import { UserRegistrationRoutes } from "./user.registration.routes.js";

// import { ClientEnvironmentProviderService } from "../../services/set.client/client.environment.provider.service";

@autoInjectable()
export class Router {

    private _app: express.Application = null;

    constructor(app: express.Application,
                private chatBotRoutes?: ChatBotRoutes,
                private whatsappWebhookRoutes?: PlatformWebhookRoutes,
                private frontendRoutes?: FrontendRoutes,
                private consentRoutes?: ConsentRoutes,
                private  userRegistrationRoutes?: UserRegistrationRoutes,
                private systemGeneratedMessagesRoutes?: SystemGeneratedMessagesRoutes,
                private intentRoutes?: IntentRoutes
    ){
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
                this.consentRoutes.register(this._app);
                this.userRegistrationRoutes.register(this._app);
                this.systemGeneratedMessagesRoutes.register(this._app);
                this.intentRoutes.register(this._app);
                resolve(true);

            } catch (error) {
                Logger.instance().log('Error initializing the router: ' + error.message);
                reject(false);
            }
        });
    };

}
