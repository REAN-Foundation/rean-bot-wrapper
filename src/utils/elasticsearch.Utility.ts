import client from '../configs/elasticsearch.config';

export const save = (data, model) => {
  if (client) {
    client.index({
      index: model,
      type: 'constituencies',
      body: data
    }, function (err, resp, status) {
      if (err) console.log("saving err", err)
      return resp;
    });
  }
}


export const getAll = (model) => {

  return new Promise((resolve, reject) => {

    client.search({
      index: model,
      type: 'constituencies',
      body: {
        query: {
          "match_all": {}
        },
      }
    }, function (error, response, status) {
      if (error) {
        console.log("search error: " + error)
        reject(error);
      }
      else {
        console.log("--- Response ---");
        console.log(response);
        console.log("--- Hits ---");
        response.hits.hits.forEach(function (hit) {
          console.log(hit);
        })
        resolve(response.hits.hits);
      }
    });
  })
}