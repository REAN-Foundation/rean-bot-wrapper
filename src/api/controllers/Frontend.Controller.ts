import { ResponseHandler } from '../../utils/response.handler';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { elasticsearchUtilities } from '../../utils/elasticsearch.utility';

@scoped(Lifecycle.ContainerScoped)
export class FrontendController {

    constructor(@inject(ResponseHandler) private responseHandler?: ResponseHandler,
                @inject(elasticsearchUtilities) private _elasticsearchUtilities ?: elasticsearchUtilities
    ) {
    }
    
    ping = async (request, response) => {
        return this.responseHandler.sendSuccessResponse(response, 200, 'pong', {}, true);
    };

    getUserList = async (req,res) =>{
        const userList = this._elasticsearchUtilities.fetchUserList(process.env.ELASTICSEARCH_MODEL);
        userList.then((data)=>{
            res.write(JSON.stringify(data));
            res.end();
        });
        
    };

    getConversation = async (req,res) =>{
        const conversation = this._elasticsearchUtilities.
            fetchConversation(process.env.ELASTICSEARCH_MODEL,req.query.chatId);
        conversation.then((data)=>{
            res.write(JSON.stringify(data));
            res.end();
        });
        
    };

}
