import { elasticsearchUtilities } from '../utils/elasticsearch.utility';

const esinstance = new elasticsearchUtilities();
export class IndexCreation {
    createIndexes() {
        if (esinstance.client) {
            const index_prefix = process.env.ELASTICSEARCH_INDEX_PREFIX ? process.env.ELASTICSEARCH_INDEX_PREFIX : 'test_';
            console.log("creating index in ES");
            esinstance.client.indices.create({
                index: index_prefix + 'chat_message'
            }, function (err, resp) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("create", resp);
                }
            });
        }
    };
}
