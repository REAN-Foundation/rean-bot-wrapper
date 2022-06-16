import { injectable } from 'tsyringe';
import { ResponseHandler } from './response.handler';

@injectable()
export class ErrorHandler{

    constructor(private responseHandler?: ResponseHandler) {
    }

    handle_controller_error = (error, res, req) => {

        var message = '';
        var error_code = 500;
        var request = req;
        var trace = '';
        var details = null;

        if (error.message) {
            message = error.message;
        }

        if (error.data) {
            var data = error.data;
            if (data !== null) {
                trace = error.data.trace;
                if (data.errorCode) {
                    error_code = error.data.errorCode;
                }
                if (data.details) {
                    details = error.data.details;
                }
            }
            if (error.Stringify) {
                trace = error.Stringify();
            }
        }
        if (error.stack) {
            trace = trace + error.stack;
        }

        this.responseHandler.sendFailureResponse(res, error_code, message, request, trace, details);
    };

    throw_service_error = (error, msg) => {
        throw new Error(msg ? msg : 'An unknown error has occurred.');
    };

}
