import { Logger } from '../common/logger';
import { injectable } from 'tsyringe';

@injectable()
export class ResponseHandler {

    constructor(private logger: Logger) {
    }

    sendSuccessResponse = (response, code, message, data, log_data = false) => {
        const obj = {
            success : true,
            message : message,
            data    : data ? data : {}
        };
        if (log_data) {
            this.logger.log_info(JSON.stringify(obj));
        }
        code = 200;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const responseMessage = data && data[0]?.value ? data[0].value : obj;
        return response.status(code).send(responseMessage);
    };

    sendSuccessResponseForApp = (response, code, message, data, log_data = false) => {
        const obj = {
            success : true,
            message : message,
            data    : data ? data : {}
        };
        if (log_data) {
            this.logger.log_info(JSON.stringify(obj));
        }
        return response.status(code).send(obj);
    };

    // sendSuccessResponseForWhatsappAPI = (response, code, message, log_data = false) => {
    //     if (log_data) {
    //         this.logger.log_info(JSON.stringify(message));
    //     }
    //     return response.status(code).send(message);
    // };

    sendSuccessResponseForSlack = (response, code, message, log_data = false) => {
        const obj = {
            "body" : {
                "challenge" : message
            }
        };
        if (log_data) {
            this.logger.log_info(JSON.stringify(obj));
        }
        return response.status(code).send(obj);
    };

    sendFailureResponse = (response, code, message, request = null, trace = null, details = null) => {
        const error = details ? details : message;
        const generic_message = details ? message : null;
        const tmp = trace ? trace.split('\n') : null;
        const trace_path = tmp ? tmp.map(x => x.trim()) : null;

        const obj: any = {
            success : false,
            error   : error,
            message : generic_message
        };

        if (process.env.NODE_ENV === 'DEVELOPMENT') {
            obj.trace = trace_path;
            obj.request = {
                host    : request.hostname,
                headers : request.headers,
                body    : request.body,
                method  : request.method,
                url     : request.originalUrl,
                params  : request.params
            };
        }

        this.logger.log_error(JSON.stringify(obj), code, 'error');

        // console.log("the response of sendfailure", response.status(code).send(obj));
        return response.status(code).send(obj);
    };

}
