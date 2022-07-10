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
            socket.user = user;
            
            if (userData.total.value >= 1) {
                socket.emit('checkLogin', user);
            } else {
                socket.emit('failLogin');
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

    socket.on('enterRoom', (roomid) => {
        socket.join(roomid);
        let load_roomid = roomid;
        let loaded_massage_list = esService.search("chat_content", {
            "query": {
                "query_string": {
                    "query": `room_id : ${load_roomid}`
                }
            },
            "sort" : [
                {
                    "@timestamp": {
                      "order": "asc"
                    }
                }
            ],
            "size" : 100                
        });

        loaded_massage_list.then(function (result) {
            result.hits.hits.map((message) => {
                let message_content = message?._source;
                console.log(message_content)
                socket.emit('load_message', message_content.chat_detail, message_content.chat_user);   
            })
        })
    })

    socket.on('reaveRoom', (roomid) => {
        socket.leave(roomid);
    })
  

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

    socket.on('send', (user, message, room_id) => {
        const timeData = calculateTime();
        let chat_id =  room_id + Math.floor(Math.random() * (10000000))
        esService.addDocument("chat_content", chat_id, {
            "room_id": room_id,
            "chat_detail": message,
            "chat_user": user,
            "chat_no" : chat_id,
            "chat_time" : timeData,
            "@timestamp" : new Date().toISOString()
        });
        socket.broadcast.to(room_id).emit('recept_message', message, user);       
    });


});

server.listen(3001, () => {
    console.log('Connected at 3001');
});

function calculateTime() {
    const chatTime = new Date();
    let setMonth = "";
    let setDay = "";
    let setHour = "";
    let setMinutes = "";
    let setSeconds = "";

    if(chatTime.getMonth()+1 < 10){
        setMonth = "0" + (chatTime.getMonth()+1);
    }else{
        setMonth = (chatTime.getMonth()+1);
    }

    if(chatTime.getDate() < 10){
        setDay = "0" + (chatTime.getDate()+1);
    }else{
        setDay = (chatTime.getDate()+1);
    }

    if(chatTime.getHours() < 10){
        setHour = "0" + (chatTime.getHours());
    }else{
        setHour = (chatTime.getHours());
    }

    if(chatTime.getMinutes() < 10){
        setMinutes = "0" + (chatTime.getMinutes());
    }else{
        setMinutes = (chatTime.getMinutes());
    }

    if(chatTime.getSeconds() < 10){
        setSeconds = "0" + (chatTime.getSeconds());
    }else{
        setSeconds = (chatTime.getSeconds());
    }

    const timeData = chatTime.getFullYear() + "-" + setMonth + "-" + setDay + " " + 
    setHour + ":" + setMinutes + ":" + setSeconds;

    return timeData;
}