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

    getConversation = async (req,res) =>{
        const model = process.env.ELASTICSEARCH_MODEL;
        let response = this._elasticsearchUtilities.getAllConversation(model);
        response.then((data)=>{
            res.write(JSON.stringify(data));
            res.end();
        });
        
    }

    getConversationMessages = async (req,res) =>{
        const model = process.env.ELASTICSEARCH_MODEL;
        let response = this._elasticsearchUtilities.getConversationMessages(model,req.query.chatId);
        response.then((data)=>{
            res.write(JSON.stringify(data));
            res.end();
        });
        
    }
}
