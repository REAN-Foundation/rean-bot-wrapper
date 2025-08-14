/* eslint-disable max-len */
import "reflect-metadata";
import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import helmet from 'helmet';
import { Router } from './api/routes/router';
import { Loader } from './startup/loader';
import { Logger } from './common/logger';
import { ConfigurationManager } from "./configs/configuration.manager";
import { IntentRegister } from './intentEmitters/intent.register';
import { container, DependencyContainer } from "tsyringe";
import { IndexCreation } from './models/elasticsearchmodel';
import { platformServiceInterface } from "./refactor/interface/platform.interface";
import { ClientEnvironmentProviderService } from "./services/set.client/client.environment.provider.service";
import { AwsSecretsManager } from "./services/secrets.services/aws.secret.manager.service";
import { Timer } from "./middleware/timer";
import { CheckCrossConnection } from "./middleware/check.cross.connection";
import { Injector } from "./startup/injector";
import { SequelizeClient } from "./connection/sequelizeClient";
import { SecretsProviderFactory } from "./factories/secrets.provider.factory";

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

    private clientsList = [];

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
    
    async processClientEnvVariables() {

        try {

            const secretsProvider = SecretsProviderFactory.createProvider();
            const secretObjectList = await secretsProvider.getSecrets();

            for (const ele of secretObjectList) {
                if (!ele.NAME) {
                    for (const k in ele) {
                        if (typeof ele[k] === "object"){
                            process.env[k.toUpperCase()] = JSON.stringify(ele[k]);
                        }
                        else {
                            process.env[k.toUpperCase()] = ele[k];
                        }
                        console.log("loading this key", k.toUpperCase());
                    }
                }
                else {
                    this.clientsList.push(ele.NAME);
                    for (const k in ele) {
                        if (typeof ele[k] === "object"){
                            process.env[ele.NAME + "_" + k.toUpperCase()] = JSON.stringify(ele[k]);
                        }
                        else {
                            process.env[ele.NAME + "_" + k.toUpperCase()] = ele[k];
                        }
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    async setWebhooksForClients() {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
        const sequelizeClient: SequelizeClient = container.resolve(SequelizeClient);
        const telegram: platformServiceInterface = container.resolve('telegram');
        const whatsapp: platformServiceInterface = container.resolve('whatsapp');
        for (const clientName of this.clientsList) {
            console.log(clientName);
            clientEnvironmentProviderService.setClientName(clientName);
            sequelizeClient.getSequelizeClient(clientEnvironmentProviderService);
            console.log(clientEnvironmentProviderService.getClientEnvironmentVariable('TELEGRAM_BOT_TOKEN'));
            if (clientEnvironmentProviderService.getClientEnvironmentVariable('TELEGRAM_BOT_TOKEN')) {
                telegram.setWebhook(clientName);
                console.log("Telegram webhook is set");
            } else {
                console.log("Telegram webhook need not to be set");
            }
            
            if (clientEnvironmentProviderService.getClientEnvironmentVariable('WHATSAPP_LIVE_API_KEY') || clientEnvironmentProviderService.getClientEnvironmentVariable('META_API_TOKEN')) {
                whatsapp.setWebhook(clientName);
            }
            else {
                console.log("whatsapp webhook need not to be set");
            }

        }

    }

    public start = async (): Promise<void> => {
        try {
            await this.processClientEnvVariables();

            //Load configurations
            ConfigurationManager.loadConfigurations();

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
            await this.setWebhooksForClients();

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
                    const serviceName = 'REANCare api' + '-' + process.env.NODE_ENV;
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
