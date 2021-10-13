import client from '../configs/elasticsearch.config';

export const createIndexes = () => {
    // client.indices.create({
    //     index: 'user_stat'
    // }, function (err, resp, status) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     else {
    //         console.log("create", resp);
    //     }
    // });
    client.indices.create({
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