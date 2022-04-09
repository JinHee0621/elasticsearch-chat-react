const express = require('express');
const http = require('http');
const fs = require('fs');
const approot = require('app-root-path');
const socket = require('socket.io');
const app = express();

const server = http.createServer(app);
const io = socket(server);
const esService = require(`${approot}/elasticsearch.service.js`);

app.use('/css', express.static('./css'))
app.use('/image', express.static('./image'))

app.get('/', (req, res) => {
    fs.readFile('./index.html', function(err,data){
        if(err){
            res.send('Error')
        }else{
            res.writeHead(200, {'Content-Type' : 'text/html'})
            res.write(data)
            res.end()
        }
    })
});

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

server.listen(3000, () => {
    console.log('Connected at 3000');
});

