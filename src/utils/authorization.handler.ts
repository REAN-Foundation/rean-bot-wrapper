import { Logger } from '../common/logger';
import { injectable } from 'tsyringe';
import { ResponseHandler } from './response.handler';

@injectable()
export class AuthorizationHandler {

    logger: Logger;

    constructor(private responseHandler: ResponseHandler) {
        this.logger = Logger.instance();
    }

    authenticate = (request, response, next) => {

        // Validate Global API KEY in request header for API request
        const auth_header = request.headers.authorization ? request.headers.authorization : '';

        if (auth_header !== process.env.GLOBAL_API_KEY) {
            this.responseHandler.sendFailureResponse(response, 401, 'Unauthorized access', request);
        } else {
            next();
        }

    };

    verifyToken = (request, response, next) => {

        const auth_header = request.headers.authorization;
        const token = auth_header && auth_header.split(' ')[1];
        if (token == null) {
            this.responseHandler.sendFailureResponse(response, 401, 'Unauthorized access', request);
        }

        try {

            // jwt.verify(token, Config.JWT_SECRET, (error, user) => {
            //     if (error) {
            //         this.responseHandler.sendFailureResponse(response, 403, 'Forebidden access', request)
            //     }
            //     request.user = user
            next();

            // })
        }
        catch (err) {
            this.logger.log(JSON.stringify(err));
            this.responseHandler.sendFailureResponse(response, 400, 'Bad request', request);
        }
    };

    generateToken = (user) => {

    };

}
