const express = require('express');
const http = require('http');
const fs = require('fs');
const cors = require('cors');
const approot = require('app-root-path');
const socket = require('socket.io');
const app = express();
const server = http.createServer(app);
const esService = require(`${approot}/elasticsearch.service.js`);

app.use(cors());
const io = socket(server, {
    cors: {
        origin : "*",
        credentials : true
    }
});


app.use('/css', express.static('./css'))
app.use('/image', express.static('./image'))

/*app.get('/', (req, res) => {
    res.send({message:'hello'})
});*/

io.on('connection', (socket) => {
    socket.on('check', () => {
        console.log('connected Page');
    });

    socket.on('checkEsConn', () => {
        let checkIndex = esService.search("testindex", {
            "query": {
                    "match_all" : {}
                }
        });
        //Promise 형태로 나타난 roomData 값을 출력
        checkIndex.then(function(result){
            console.log(result.hits.hits[0]);
        })
    })
});

server.listen(3001, () => {
    console.log('Connected at 3001');
});

