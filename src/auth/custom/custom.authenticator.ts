import { Logger } from '../../common/logger';
import { IAuthenticator } from '../authenticator.interface';
import { AuthenticationResult } from '../../domain.types/auth/auth.domain.types';

export class CustomAuthenticator implements IAuthenticator {

    constructor() {
    }

    public authenticateUser = async (
        request: any
    ): Promise<AuthenticationResult> => {
        try {
            var res: AuthenticationResult = {
                Result        : true,
                Message       : 'Authenticated',
                HttpErrorCode : 200,
            };

            const authHeader = request.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (token == null) {
                res = {
                    Result        : false,
                    Message       : 'Unauthorized user access',
                    HttpErrorCode : 401,
                };
                return res;
            }

            if (token !== process.env.GLOBAL_API_KEY) {
                res = {
                    Result        : false,
                    Message       : 'Forebidden user access',
                    HttpErrorCode : 403,
                };
                return res;
            }
        } catch (err) {
            Logger.instance().log(JSON.stringify(err, null, 2));
            res = {
                Result        : false,
                Message       : 'Error authenticating user',
                HttpErrorCode : 401,
            };
        }
        return res;
    };

    authenticateClient(request: any, response: any): Promise<AuthenticationResult> {
        return Promise.resolve(undefined);
    }

}
