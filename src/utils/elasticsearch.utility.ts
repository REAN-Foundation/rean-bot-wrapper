import elasticsearch from 'elasticsearch';
import { singleton } from 'tsyringe';

@singleton()
export class elasticsearchUtilities{

    public client:elasticsearch.Client ;

    constructor(){
        this.createclient();}

    async createclient() {
        if (process.env.ELASTICSEARCH_HOST) {
            this.client = new elasticsearch.Client({
                hosts :
                    process.env.ELASTICSEARCH_HOST,
                    ssl : { rejectUnauthorized: false, pfx: [] }
                });
            }
        }

    save = (data, model) => {
        if (this.client) {
            console.log("wnter ES utility 'save'");
            this.client.index(
                {
                    index : model,
                    type  : 'constituencies',
                    body  : data,
                },
                function (err, resp) {
                    if (err) console.log('saving err', err);
                    return resp;
                }
            );
        }
    };

    getAll = (model) => {
        return new Promise((resolve, reject) => {
            console.log("wnter ES utility 'getAll'");

            this.client.search(
                {
                    index : model,
                    type  : 'constituencies',
                    body  : {
                        query : {
                            match_all : {},
                        },
                    },
                },
                function (error, response) {
                    if (error) {
                        console.log('search error: ' + error);
                        reject(error);
                    } else {
                        console.log('--- Response ---');
                        console.log(response);
                        console.log('--- Hits ---');
                        response.hits.hits.forEach(function (hit) {
                            console.log(hit);
                        });
                        resolve(response.hits.hits);
                    }
                }
            );
        });
    };

    fetchUserList = (model) => {
        return new Promise((resolve, reject) => {
            this.client.search(
                {
                    index : model,
                    type  : 'constituencies',
                    body  : {
                        size : 0,
                        aggs : {
                            group_by_mobile : {
                                terms : {
                                    field : 'sessionId.keyword',
                                },
                                aggs : {
                                    group_by_mobile : {
                                        top_hits : {
                                            size    : 1,
                                            _source : {
                                                include : ['name', 'sessionId','platform'],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                function (error, response) {
                    if (error) {
                        console.log('search error: ' + error);
                        reject(error);
                    } else {
                        const result = [];
                        response.aggregations.group_by_mobile.buckets.forEach(function (bucket) {
                            result.push(bucket.group_by_mobile.hits.hits[0]._source);
                        });
                        resolve(result);
                    }
                }
            );
        });
    };

    fetchConversation = (model,chatId) => {
        return new Promise((resolve, reject) => {
            const newLocal = 'constituencies';
            this.client.search(
                {
                    index : model,
                    type  : newLocal,
                    body  : {
                        query : {
                            match : {
                                sessionId : chatId,
                            },
                        },
                        sort : [{ created_at: { order: 'asc' } }],
                    },
                },
                function (error, response) {
                    if (error) {
                        console.log('search error: ' + error);
                        reject(error);
                    } else {
                        const result = [];
                        response.hits.hits.forEach(function (bucket) {
                            result.push(bucket._source);
                        });
                        resolve(result);
                    }
                }
            );
        });
    }

}
