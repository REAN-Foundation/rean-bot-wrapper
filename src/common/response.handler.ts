import express from 'express';
import { Logger } from './logger.js';
import { ActivityRecorder } from './activity.recorder.js';
import { InputValidationError } from './input.validation.error.js';
import type { ResponseDto } from '../domain.types/miscellaneous/response.dto.js';

export class ResponseHandler {

    public static createResponseObject (status,message,httpCode,data,trace_path,request,ips) {
        const responseObject: ResponseDto = {
            Status   : status,
            Message  : message,
            HttpCode : httpCode ?? 200,
            Data     : data,
            Trace    : trace_path,
            Client   : request ? request.currentClient : null,
            User     : request ? request.currentUser : null,
            Context  : request ? request.context : null,
            Request  : {
                Method  : request ? request.method : null,
                Host    : request ? request.hostname : null,
                Body    : request ? request.body : null,
                Headers : request ? request.headers : null,
                Url     : request ? request.originalUrl : null,
                Params  : request ? request.params : null,
            },
            ClientIps      : request && request.ips.length > 0 ? request.ips : ips,
            APIVersion     : process.env.API_VERSION,
            ServiceVersion : process.env.SERVICE_VERSION,
        };
        return responseObject;
    }

    public static failure(
        request: any,
        response: express.Response,
        message?: string,
        httpErrorCode?: number,
        error?: Error
    ) {
        const ips = [
            request.header('x-forwarded-for') || request.socket.remoteAddress
        ];

        const msg = error ? error.message : (message ? message : 'An error has occurred.');

        const errorStack = error ? error.stack : '';
        const tmp = errorStack.split('\n');
        const trace_path = tmp.map(x => x.trim());
        const data = null;

        const responseObject = this.createResponseObject("failure",msg,httpErrorCode,data,trace_path,request,ips);

        if (process.env.NODE_ENV !== 'test') {
            Logger.instance().log(JSON.stringify(responseObject, null, 2));
        }

        ActivityRecorder.record(responseObject);

        //Don't send request related info in response, only use it for logging
        delete responseObject.Request;
        return response.status(httpErrorCode).send(responseObject);
    }

    public static success(
        request: any,
        response: express.Response,
        message:string,
        httpCode: number,
        data?: any,
        logDataObject = true) {

        const ips = [
            request.header('x-forwarded-for') || request.socket.remoteAddress
        ];

        const Trace = null;

        const responseObject = this.createResponseObject("success",message,httpCode,data,Trace,request,ips);

        if (process.env.NODE_ENV !== 'test') {
            if (!logDataObject) {
                responseObject.Data = null;
            }
            Logger.instance().log(JSON.stringify(responseObject, null, 2));
        }

        ActivityRecorder.record(responseObject);

        //Don't send request related info in response, only use it for logging
        delete responseObject.Request;
        return response.status(httpCode).send(responseObject);
    }

    static handleError(
        request: express.Request,
        response: express.Response,
        error: Error) {

        if (error instanceof InputValidationError) {
            const validationError = error as InputValidationError;
            ResponseHandler.failure(request, response, validationError.message, validationError.httpErrorCode, error);
        }
        else {
            ResponseHandler.failure(request, response, error.message, 400, error);
        }
    }

}
