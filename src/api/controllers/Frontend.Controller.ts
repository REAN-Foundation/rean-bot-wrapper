import { ResponseHandler } from '../../utils/response.handler';
import { autoInjectable } from 'tsyringe';
import { elasticsearchUtilities } from '../../utils/elasticsearch.utility';
@autoInjectable()
export class FrontendController {

    constructor(private responseHandler?: ResponseHandler,
                private _elasticsearchUtilities ?: elasticsearchUtilities
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
        
    }

    getConversation = async (req,res) =>{
        const conversation = this._elasticsearchUtilities.
            fetchConversation(process.env.ELASTICSEARCH_MODEL,req.query.chatId);
        conversation.then((data)=>{
            res.write(JSON.stringify(data));
            res.end();
        });
        
    }

}
