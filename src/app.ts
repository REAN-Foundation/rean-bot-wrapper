/* eslint-disable max-len */
import "reflect-metadata";
import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import helmet from 'helmet';
import { Router } from './api/routes/router.js';
import { Loader } from './startup/loader.js';
import { Logger } from './common/logger.js';
import { ConfigurationManager } from "./configs/configuration.manager.js";
import { IntentRegister } from './intentEmitters/intent.register.js';
import { container } from "tsyringe";
import type { DependencyContainer} from "tsyringe";
import { IndexCreation } from './models/elasticsearchmodel.js';
import type { platformServiceInterface } from "./refactor/interface/platform.interface.js";
import { ClientEnvironmentProviderService } from "./services/set.client/client.environment.provider.service.js";
import { AwsSecretsManager } from "./modules/secrets/providers/aws.secret.manager.service.js";
import { Timer } from "./middleware/timer.js";
import { CheckCrossConnection } from "./middleware/check.cross.connection.js";
import { Injector } from "./startup/injector.js";
import { SequelizeClient } from "./connection/sequelizeClient.js";
import { TenantSecretsService } from "./services/tenant.secret/tenant.secret.service.js";
import { ModuleInjector } from "./modules/module.injector.js";
import { Module } from "module";

declare module "express-serve-static-core" {
    interface Request {
      container: DependencyContainer;
    }
  }

export default class Application {

    public _app: express.Application = null;

    private _router: Router = null;

    private static _instance: Application = null;

    private _intentRegister: IntentRegister = null;

    private _IndexCreation: IndexCreation = null;

    private _awsSecretsManager: AwsSecretsManager = null;

    private _timer: Timer = null;

    private _checkCrossConnection: CheckCrossConnection = null;


    // private clientsList = [];

    private constructor() {
        this._app = express();
        this._intentRegister = new IntentRegister();
        this._IndexCreation = new IndexCreation();
        this._awsSecretsManager = new AwsSecretsManager();
    }

    public static instance(): Application {
        return this._instance || (this._instance = new this());
    }

    public app(): express.Application {
        return this._app;
    }


    async setWebhooksForClients(clientsList: string[]) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
        const sequelizeClient: SequelizeClient = container.resolve(SequelizeClient);
        const telegram: platformServiceInterface = container.resolve('telegram');
        const whatsapp: platformServiceInterface = container.resolve('whatsapp');
        for (const clientName of clientsList) {
            console.log(clientName);
            clientEnvironmentProviderService.setClientName(clientName);
            sequelizeClient.getSequelizeClient(clientEnvironmentProviderService);
            const telegramToken = await clientEnvironmentProviderService.getClientEnvironmentVariable('TELEGRAM_BOT_TOKEN');
            const whatsappToken = await clientEnvironmentProviderService.getClientEnvironmentVariable('WHATSAPP_LIVE_API_KEY') || await clientEnvironmentProviderService.getClientEnvironmentVariable('META_API_TOKEN');
            console.log(telegramToken);
            if (telegramToken) {
                await telegram.setWebhook(clientName);
                console.log("Telegram webhook is set");
            } else {
                console.log("Telegram webhook need not to be set");
            }

            if (whatsappToken) {
                await whatsapp.setWebhook(clientName);
            }
            else {
                console.log("whatsapp webhook need not to be set");
            }

        }

    }


    public start = async (): Promise<void> => {
        try {

            //Load configurations
            ConfigurationManager.loadConfigurations();

            ModuleInjector.registerInjections(container);

            const secretsService = container.resolve(TenantSecretsService);

            const clientList = await secretsService.loadClientEnvVariables();


            //Load the modules
            await Loader.init();
            this._router = new Router(this._app);

            //Set-up middlewares
            await this.setupMiddlewares();

            //Set the routes
            await this._router.init();

            this._intentRegister.register();

            this._IndexCreation.createIndexes();

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            await this.setWebhooksForClients(clientList);

            await Loader.scheduler.schedule();

            //Start listening
            await this.listen();

            //time of restart
            const date_ob = new Date();
            const date = ("0" + date_ob.getDate()).slice(-2);
            const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
            const year = date_ob.getFullYear();
            const hours = date_ob.getHours();
            const minutes = date_ob.getMinutes();
            const seconds = date_ob.getSeconds();
            console.log("time of restart", year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

        }
        catch (error) {
            Logger.instance().log('An error occurred while starting reancare-api service.' + error.message);
        }
    };

    private setupMiddlewares = async (): Promise<boolean> => {

        return new Promise((resolve, reject) => {
            try {
                this._app.use((req, _res, next) => {
                    req.container = Loader.container.createChildContainer();
                    Injector.registerInjections(req.container);
                    next();
                });
                this._app.use(express.urlencoded({ extended: true }));
                this._app.use(express.json());
                this._app.use(helmet());
                this._app.use(cors());
                this._timer = new Timer(this._app);
                this._timer.timingRequestAndResponseCycle();
                this._checkCrossConnection = new CheckCrossConnection();
                this._app.use(this._checkCrossConnection.checkCrossConnection);

                // this._app.use(this.limiter);

                const MAX_UPLOAD_FILE_SIZE = ConfigurationManager.MaxUploadFileSize();

                this._app.use(fileUpload({
                    limits            : { fileSize: MAX_UPLOAD_FILE_SIZE },
                    preserveExtension : true,
                    createParentPath  : true,
                    parseNested       : true,
                    useTempFiles      : true,
                    tempFileDir       : '/tmp/uploads/'
                }));
                resolve(true);
            }
            catch (error) {
                reject(error);
            }
        });
    };

    private listen = () => {
        return new Promise((resolve, reject) => {
            try {
                const port = process.env.PORT;
                const server = this._app.listen(port, () => {
                    const serviceName = 'Rean-Bot-Wrapper' + '-' + process.env.NODE_ENV;
                    Logger.instance().log(serviceName + ' is up and listening on port ' + process.env.PORT.toString());
                    this._app.emit("server_started");
                });
                module.exports.server = server;
                resolve(this._app);
            }
            catch (error) {
                reject(error);
            }
        });
    };

}
