import { injectable } from 'tsyringe';

@injectable()
export class Logger {

    private static _instance: Logger = null;

    public static instance(): Logger {
        return this._instance || (this._instance = new this());
    }

    public log = (message: string): void => {
        const dateTime = new Date().toISOString();
        const temp_str = dateTime + '> ' + message;
        console.log(' ');
        console.log(temp_str);
    }

    public error = (message: string, code: number, details: unknown): void => {
        const dateTime = new Date().toISOString();
        const err = {
            message : message,
            code    : code,
            details : details
        };
        const temp_str = dateTime + '> ' + JSON.stringify(err, null, '    ');
        console.log(' ');
        console.log(temp_str);
    }

    public log_error = (message, code, details) => {
        const dateTime = new Date().toISOString();

        let msg: any = {
            message : message,
            code    : code,
            details : details
        };

        msg = dateTime + '> ' + JSON.stringify(msg);
        console.log('[Error] ', msg);
    }

    public log_info = (message, data = '') => {
        const dateTime = new Date().toISOString();
        let msg: any = {
            message : message,
            data    : data
        };
        msg = dateTime + '> ' + JSON.stringify(msg);

        if (process.env.NODE_ENV == 'DEVELOPMENT') {
            console.log('[INFO] ', msg);
        }
    }

    public log_warning = (message, data = '') => {
        const dateTime = new Date().toISOString();
        let msg: any = {
            message : message,
            data    : data
        };
        msg = dateTime + '> ' + JSON.stringify(msg);

        if (process.env.NODE_ENV == 'DEVELOPMENT') {
            console.log('[WARNING] ', msg);
        }
    }

}
