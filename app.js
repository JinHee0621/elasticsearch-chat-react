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
        origin: "http://localhost:3000",
        credentials: true
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

    socket.on('login', (user, password) => {
        console.log(user + " : " + password)
        let dologin = esService.search("chat_user", {
            "query": {
                "query_string": {
                    "query": "user_id : " + user + " AND user_pass : " + password
                }
            }
        });

        dologin.then(function (result) {
            console.log(result);
            let userData = result.hits;
            if (userData.total.value >= 1) {
                socket.emit('checkLogin', user);
            } else {
                console.log("로그인 실패")
            }
        })
        //
    });

    socket.on('loadRoom',(user) => {
        console.log("Call Room Lists");
        let callList = esService.search("chat_room", {
            "query": {
                "query_string": {
                    "query": "room_users : *"+user+"*"
                }
            }
        });

        callList.then(function (result) {
            socket.emit('renderlist', result.hits.hits);            
        })
        //
    });

    socket.on('join', (user, password) => {
        esService.addDocument("chat_user", password + Math.floor(Math.random() * (10000000)), {
            "user_id": user,
            "user_pass": password,
            "profile": null
        });
    });

    socket.on('checkEsConn', () => {
        let checkIndex = esService.search("testindex", {
            "query": {
                "match_all": {}
            }
        });
        //Promise 형태로 나타난 roomData 값을 출력
        checkIndex.then(function (result) {
            console.log(result.hits.hits[0]);
        })
    })
});

server.listen(3001, () => {
    console.log('Connected at 3001');
});

