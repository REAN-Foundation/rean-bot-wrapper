import { elasticsearchUtilities } from '../utils/elasticsearch.utility';

let esinstance = new elasticsearchUtilities()
export const createIndexes = () => {
    esinstance.client.indices.create({
        index: 'test_chat_message'
    }, function (err, resp, status) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("create", resp);
        }
    });
}