const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http, {
    perMessageDeflate: false
});
const fetch = require('node-fetch');
var querystring = require('querystring');   // Part of Node.js

const APPID = "";
const APPKEY = "";
const ENDPOINT = `https://westus.api.cognitive.microsoft.com/luis/prediction/v3.0/apps/${APPID}/slots/production/predict`;

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Note: if deployed on Azure, web sockets might fail if deployed to Linux free tier.
// See: https://docs.microsoft.com/en-us/azure/app-service/faq-app-service-linux#web-sockets
// https://github.com/MicrosoftDocs/azure-docs/issues/49245
// socket.io still finds a way to connect, so you get an error message in the browser console,
// but it still works.

io.on('connection', async (socket) => {
    socket.on('assessment', async (msg) => {
        console.log("Got assessment: " + msg);
        await sendToLuis(msg, socket.id);
    });
});

async function sendToLuis(assessment, socketId) {
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
        "verbose": true,    // We need verbose so that we can access the entity data in a generic way
        "show-all-intents": false,
        "log": true,        // Also log query to LUIS console
        "query": assessment
    }

    var luisRequest =
        ENDPOINT +
        '?' + querystring.stringify(queryParams);

    try {
        const response = await fetch(luisRequest);
        if (!response.ok) {
            console.log('Error with request: ' + response.statusText);
            io.to(socketId).emit('Error', 'Sorry, I had problems with the request. ' + response.statusText);
        }
        const data = await response.json();
        console.log("Received data: " + JSON.stringify(data));

        // // Check if the relevant properties exist
        if (!data.prediction.entities.$instance ||
            !Object.keys(data.prediction.entities.$instance) ||
            !Object.keys(data.prediction.entities.$instance)[0] ||
            !data.prediction.entities.$instance[Object.keys(data.prediction.entities.$instance)[0]][0].text) {
            console.log('Missing query, intent or entity: ');
            console.log(data);
            io.to(socketId).emit('Error', 'Sorry, I could not understand that. [No intent or entity identified]');
            return;
        }

        const instance = data.prediction.entities.$instance;
        //console.log("Entity $instance: " + JSON.stringify(instance));
        //console.log("Name of first element in $instance (not an array!): " + Object.keys(instance)[0]);
        const firstInstance = Object.keys(instance)[0];
        //console.log("Accessing first element in $instance: " + JSON.stringify(instance[firstInstance]));
        //console.log("Text in first element in $instance: " + instance[firstInstance][0].text);
        const firstInstanceText = instance[firstInstance][0].text;

        console.log(`Query: ${data.query}`);
        console.log(`Top Intent: ${data.prediction.topIntent}`);
        console.log(`Entity text: ${firstInstanceText}`);

        io.to(socketId).emit(data.prediction.topIntent, firstInstanceText);
    } catch (error) {
        console.log(error);
        io.to(socketId).emit('Error', 'Error understanding your assessment: ' + error);
    }

}


http.listen(PORT, () => console.log(`Vital Signs Checklist server listening on port ${PORT}!`));