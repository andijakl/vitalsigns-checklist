const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var querystring = require('querystring');

const ENDPOINT = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/";
const APPID = "";
const APPKEY = "";

app.use(express.static('public'));

io.on('connection', function (socket) {
    socket.on('assessment', function (msg) {
        sendToLuis(msg, socket.id);
    });
});

function sendToLuis(assessment, socketId) {
    // Check if we have all the data we need
    if (!ENDPOINT || !APPID || !APPKEY) {
        io.to(socketId).emit('Error', 'Missing configuration on the server.');
        return;
    }
    if (!assessment) {
        io.to(socketId).emit('Error', 'Please enter an assessment.');
        return;
    }
    // Send to LUIS
    var queryParams = {
        "subscription-key": APPKEY,
        "verbose": true, // If true will return all intents instead of just the topscoring intent
        "q": assessment
    }

    var luisRequest =
        ENDPOINT + APPID +
        '?' + querystring.stringify(queryParams);

    request(luisRequest,
        function (err, response, body) {
            if (err) {
                console.log(err);
                io.to(socketId).emit('Error', 'Error understanding your assessment: ' + err);
            } else {
                var data = JSON.parse(body);

                // Check if the relevant properties exist
                if (!data.hasOwnProperty('query') ||
                    !data.topScoringIntent.hasOwnProperty('intent') ||
                    !data.entities[0] ||
                    !data.entities[0].hasOwnProperty('entity')) {
                    console.log('Missing query, intent or entity: ');
                    console.log(data);
                    io.to(socketId).emit('Error', 'Sorry, I could not understand that. [No intent or entity identified]');
                    return;
                }

                console.log(`Query: ${data.query}`);
                console.log(`Top Intent: ${data.topScoringIntent.intent}`);
                console.log(`Entity: ${data.entities[0].entity}`);

                io.to(socketId).emit(data.topScoringIntent.intent, data.entities[0].entity);
            }
        }
    );
}

http.listen(3000, () => console.log('Vital Signs Checklist server listening on port 3000!'));