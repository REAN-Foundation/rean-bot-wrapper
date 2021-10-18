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
import { WhatsappMessageService } from './services/whatsapp-message.service';
import { ReplyTelegramMessage } from './services/TelegramMessage.Service';
import  TelegramBot  from 'node-telegram-bot-api';

/////////////////////////////////////////////////////////////////////////

export default class Application {

    public _app: express.Application = null;

    private _router: Router = null;

    private static _instance: Application = null;

    private _intentRegister: IntentRegister = null;

    private _whatsappMessageService: WhatsappMessageService = null;

    private _replyTelegramMessage: ReplyTelegramMessage = null;

    private _telegram: TelegramBot = null;

    private constructor() {
        this._app = express();
        this._router = new Router(this._app);
        this._intentRegister = new IntentRegister();
        this._whatsappMessageService = new WhatsappMessageService();
        this._replyTelegramMessage = new ReplyTelegramMessage();
        this._telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
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

            // if (process.env.NODE_ENV === 'test') {
            //     await Loader.databaseConnector.dropDatabase();
            // }

            //Connect with database
            // await Loader.databaseConnector.init();

            //Set-up middlewares
            await this.setupMiddlewares();

            //Set the routes
            await this._router.init();

            //Seed the service
            // await Loader.seeder.init();

            //Set-up cron jobs

            this._intentRegister.register();

            this._whatsappMessageService.SetWebHook();

            const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
            const baseUrl = process.env.BASE_URL;

            this._app.post(`/bot${TELEGRAM_TOKEN}`, (req, res) => {
                this._telegram.processUpdate(req.body);
                res.sendStatus(200);
            });

            // This informs the Telegram servers of the new webhook.
            this._telegram.setWebHook(baseUrl + '/bot' + TELEGRAM_TOKEN);

            // Process telegram request
            this._telegram.on('message', msg => {
                // ReplyTelegramMessage(this._telegram, msg);
                this._replyTelegramMessage.handleUserRequest(this._telegram, msg);
            });

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
