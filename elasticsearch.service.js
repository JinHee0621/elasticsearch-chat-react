const elasticsearch = require('elasticsearch');

let elasticClient;
let setElasticClient = ()=>{
    let elasticSet = [{"IP": "localhost", "PORT":"9200"}];
    let elasticUrl = [];
    elasticSet.forEach((item, index) => {
        elasticUrl.push(item.IP + ":" + item.PORT);
    });
    elasticClient = new elasticsearch.Client({
        hosts: elasticUrl
    })
    console.log(elasticUrl);
}

setElasticClient();

module.exports = {
    ping: ()=> {
        elasticClient.ping({
            requestTimeout: 30000,
        }, (error) => {
            if(error) {
                console.log('elasticsearch cluster is down!');
            }
            console.log('All is well at Service');
        });
    },

    // ElasticSearch Index 내의 신규 document 생성
    addDocument: (indexName, _id, payload) => elasticClient.index({
        index: indexName,
        id: _id,
        refresh: 'wait_for',
        body: payload
    }).catch((err) => {
        console.log(err);
        throw err;
    }).then((message) => {
        console.log(message);
    }),

    // ElasticSearch Index에서 id에 해당하는 document 수정
    update: async (indexName, _id, payload) => elasticClient.update({
        index: indexName,
        id: _id,
        body: payload
    }).catch((err) => {
        console.log(err);
        throw err;
    }),

    // ElasticSearch 에서 Index 대상으로 search 실행 
    search: async (indexName, payload) => elasticClient.search({
        index: indexName,
        body: payload
    }).catch((err) => {
        console.log("Error " + err);
    })
    
}