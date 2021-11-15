import elasticsearch from 'elasticsearch';
import { singleton } from 'tsyringe';

@singleton()
export class elasticsearchUtilities{

  public client:elasticsearch.Client ;

  constructor(){
      this.createclient();
  }

  async createclient() {
      if (process.env.ELASTICSEARCH_HOST) {
          this.client = new elasticsearch.Client({
              hosts : 
                process.env.ELASTICSEARCH_HOST,
                ssl:{ rejectUnauthorized: false, pfx: [] }
              
          });
      }
  }

    save = (data, model) => {
        if (this.client) {
            this.client.index({
                index : model,
                type  : 'constituencies',
                body  : data
            }, function (err, resp) {
                if (err) console.log("saving err", err);
                return resp;
            });
        }
    }

    getAll = (model) => {

        return new Promise((resolve, reject) => {
            this.client.search({
                index : model,
                type  : 'constituencies',
                body  : {
                    query : {
                        "match_all" : {}
                    },
                }
            }, function (error, response) {
                if (error) {
                    console.log("search error: " + error);
                    reject(error);
                }
                else {
                    console.log("--- Response ---");
                    console.log(response);
                    console.log("--- Hits ---");
                    response.hits.hits.forEach(function (hit) {
                        console.log(hit);
                    });
                    resolve(response.hits.hits);
                }
            });
        });
    }

}
