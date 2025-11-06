import { ResponseHandler } from '../../utils/response.handler.js';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class CommonController {

    constructor(private responseHandler?: ResponseHandler) {
    }
    
    ping = async (request, response) => {
        return this.responseHandler.sendSuccessResponse(response, 200, 'pong', {}, true);
    };

}
