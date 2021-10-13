import elasticsearch from 'elasticsearch';

var client;
if (process.env.ELASTICSEARCH_HOST) {

  client = new elasticsearch.Client({
    hosts: [
      process.env.ELASTICSEARCH_HOST
    ]
  });
}
else {
  client = false;
}

export default client;