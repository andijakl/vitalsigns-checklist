const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var querystring = require('querystring');

const ENDPOINT = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/";
const APPID = "XXX";
const APPKEY = "XXX";

app.use(express.static('public'));

io.on('connection', function (socket) {
    socket.on('assessment', function (msg) {
        sendToLuis(msg, socket.id);
        //io.emit('chat message', msg);
        //io.to(socket.id).emit('temperature', 36);
        //console.log("Message: " + msg);
    });
});

function sendToLuis(assessment, socketId) {
    // Send to LUIS
    var queryParams = {
        "subscription-key": APPKEY,
        "verbose": true,    // If true will return all intents instead of just the topscoring intent
        "q": assessment
    }
    
    var luisRequest =
        ENDPOINT + APPID +
        '?' + querystring.stringify(queryParams);

    request(luisRequest,
        function (err, response, body) {
            if (err)
                console.log(err);
            else {
                var data = JSON.parse(body);

                console.log(`Query: ${data.query}`);
                console.log(`Top Intent: ${data.topScoringIntent.intent}`);
                if (data.entities.length > 0) {
                    console.log(`Entity: ${data.entities[0].entity}`);
                    io.to(socketId).emit(data.topScoringIntent.intent, data.entities[0].entity);
                } else {
                    console.log('No entity found in response');
                    console.log(data);
                }
            }
        });
}

http.listen(3000, () => console.log('Example app listening on port 3000!'));