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
import {container} from "tsyringe";

export default class Application {

    public _app: express.Application = null;

    private _router: Router = null;

    private static _instance: Application = null;

    private _intentRegister: IntentRegister = null;

    private constructor() {
        this._app = express();
        this._intentRegister = new IntentRegister();
    }

    public static instance(): Application {
        return this._instance || (this._instance = new this());
    }

    public app(): express.Application {
        return this._app;
    }

    public start = async(): Promise<void> => {
        try {

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
            let me = container.resolve('telegram');
            let me2 = container.resolve('whatsapp');

            //Start listening
            await this.listen();

        }
        catch (error){
            Logger.instance().log('An error occurred while starting reancare-api service.' + error.message);
        }
    }

    private setupMiddlewares = async (): Promise<boolean> => {

        return new Promise((resolve, reject) => {
            try {
                this._app.use(express.urlencoded({ extended: true }));
                this._app.use(express.json());
                this._app.use(helmet());
                this._app.use(cors());

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
    }

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
    }

}
