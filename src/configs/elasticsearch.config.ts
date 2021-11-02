// import elasticsearch from 'elasticsearch';

// export class elasticsearchClient{
//   async createclient() {
//     let client;
//     if (process.env.ELASTICSEARCH_HOST) {
//       client = new elasticsearch.Client({
//         hosts: [
//           process.env.ELASTICSEARCH_HOST
//         ]
//       });
//     }
//     else {
//       client = false;
//     }
//     return client
//   }
// }

// var client;
// if (process.env.ELASTICSEARCH_HOST) {
//   console.log("enter ES, the ES host is",process.env.ELASTICSEARCH_HOST)

//   client = new elasticsearch.Client({
//     hosts: [
//       process.env.ELASTICSEARCH_HOST
//     ]
//   });
//   console.log("the client is", client.transport)
// }
// else {
//   client = false;
// }

// export default client;
