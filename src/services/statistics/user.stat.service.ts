import { elasticsearchUtilities } from '../../utils/elasticsearch.utility.js';
import { Lifecycle, inject, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service.js';

@scoped(Lifecycle.ContainerScoped)
export class elasticsearchUserstat{

    constructor(
        @inject(elasticsearchUtilities) private _elasticsearchUtilities?: elasticsearchUtilities,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    createUserStat = async (req) => {
        req.created_at = new Date();
        const elasticsearchIndexPrefix = this.clientEnvironmentProviderService.getClientEnvironmentVariable("ELASTICSEARCH_INDEX_PREFIX");
        const index_prefix = elasticsearchIndexPrefix ? process.env.ELASTICSEARCH_INDEX_PREFIX : 'test_';
        const userStatModel = index_prefix + "chat_message";
        this._elasticsearchUtilities.save(req, userStatModel);
    };

    getUserStat = async () => {
        console.log("wnter ES service 'getUserStat'");

        const userStatModel = "user_stat";
        const res = await this._elasticsearchUtilities.getAll(userStatModel);
        console.log("get", res);
        return res;
    };

}
