import { injectable } from 'tsyringe';
import { ResponseHandler } from './response.handler';

@injectable()
export class ErrorHandler {

    constructor(private responseHandler: ResponseHandler) {}

    // Method to handle controller errors
    public handleControllerError(
        error: any,
        res: any,
        req: any
    ): void {
        let message: string = error?.message || 'An unexpected error occurred.';
        let errorCode = 500;
        let trace = '';
        let details: any = null;

        if (error?.data || error?.response?.data) {
            const data: any =
                typeof error.data === 'string' ? JSON.parse(error.data ?? error.response.data) : error.data ?? error.response.data;

            if (data) {
                trace = data.trace || '';
                errorCode = data.HttpCode ?? data.errorCode ?? errorCode;
                message = data.Message ?? data.message ?? message;
                details = data.details || null;
            }
        }

        if (error?.Stringify) {
            trace = error.Stringify();
        }

        if (error?.stack) {
            trace += error.stack;
        }

        this.responseHandler.sendFailureResponse(res, errorCode, message, req, trace, details);
    }

    // Method to throw a service error
    public throwServiceError(error: any, msg?: string): never {
        throw new Error(msg || 'An unknown error has occurred.');
    }

}
