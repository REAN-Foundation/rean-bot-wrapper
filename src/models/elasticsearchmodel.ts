import { elasticsearchUtilities } from '../utils/elasticsearch.utility';

const esinstance = new elasticsearchUtilities();
export const createIndexes = () => {
    esinstance.client.indices.create({
        index : 'test_chat_message'
    }, function (err, resp) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("create", resp);
        }
    });
};
