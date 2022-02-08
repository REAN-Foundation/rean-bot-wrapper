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
import { container } from "tsyringe";
import { IndexCreation } from './models/elasticsearchmodel';
import { platformServiceInterface } from "./refactor/interface/platform.interface";
import { ClientEnvironmentProviderService } from "./services/set.client/client.environment.provider.service";
import { AwsSecretsManager } from "./services/aws.secret.manager.service";

// import RateLimit from 'express-rate-limit';

export default class Application {

    public _app: express.Application = null;

    private _router: Router = null;

    private static _instance: Application = null;

    private _intentRegister: IntentRegister = null;

    private _IndexCreation: IndexCreation = null;

    private _awsSecretsManager: AwsSecretsManager = null;

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
            const secretObjectList = await this._awsSecretsManager.getSecrets();

            for (const ele of secretObjectList) {
                if (!ele.NAME) {
                    for (const k in ele) {
                        if (typeof ele[k] === "object"){
                            process.env[k.toUpperCase()] = JSON.stringify(ele[k]);
                        }
                        else {
                            process.env[k.toUpperCase()] = ele[k];
                        }
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

    setWebhooksForClients() {
        // eslint-disable-next-line max-len
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
        const telegram: platformServiceInterface = container.resolve('telegram');
        const anemiaTelegram: platformServiceInterface = container.resolve('anemiaTelegram');
        const whatsapp: platformServiceInterface = container.resolve('whatsapp');
        for (const clientName of this.clientsList) {
            clientEnvironmentProviderService.setClientName(clientName);
            if (clientName === "ANEMIA"){
                anemiaTelegram.setWebhook(clientName);
            } else {
                telegram.setWebhook(clientName);
                whatsapp.setWebhook(clientName);
            }

        }

    }

    // private limiter = RateLimit({
    //     windowMs : 1 * 60 * 1000, // 1 minute
    //     max : 5
    // });

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
            this.setWebhooksForClients();

            //Start listening
            await this.listen();

        }
        catch (error) {
            Logger.instance().log('An error occurred while starting reancare-api service.' + error.message);
        }
    };

    private setupMiddlewares = async (): Promise<boolean> => {

        return new Promise((resolve, reject) => {
            try {
                this._app.use(express.urlencoded({ extended: true }));
                this._app.use(express.json());
                this._app.use(helmet());
                this._app.use(cors());

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
