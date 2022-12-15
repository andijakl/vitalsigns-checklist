import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";

// For creating the Node JS server in the ES modules syntax
// based on Express, see: 
// https://socket.io/docs/v4/server-initialization/#with-express
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer);

import fetch from 'node-fetch';

// TODO: configure these values according to your deployment!
const ENDPOINT_ID = "";
const PROJECT_NAME = "";
const APPKEY = "";
const DEPLOYMENT_NAME = "";

// YOu do not need to change the following settings
const ENDPOINT = `https://${ENDPOINT_ID}.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2022-10-01-preview`;
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Note: if deployed on Azure, web sockets have some limitations on the Linux free tier.
// See: https://docs.microsoft.com/en-us/azure/app-service/faq-app-service-linux#web-sockets
// socket.io still finds a way to connect, so you get an error message in the browser console,
// but it still works.

io.on('connection', async (socket) => {
    socket.on('assessment', async (msg) => {
        console.log("Got assessment: " + msg);
        await sendToCognitiveService(msg, socket.id);
    });
});

async function sendToCognitiveService(assessment, socketId) {
    // Check if we have all the data we need
    if (!ENDPOINT_ID || !PROJECT_NAME || !APPKEY || !DEPLOYMENT_NAME) {
        io.to(socketId).emit('Error', 'Missing configuration on the server.');
        return;
    }
    if (!assessment) {
        io.to(socketId).emit('Error', 'Please enter an assessment.');
        return;
    }

    // Header Ocp-Apim-Subscription-Key is required for the endpoint   
    let headers = {
        "Ocp-Apim-Subscription-Key": APPKEY,
        "Content-Type": "application/json"
    }

    let requestBody = {
        "kind": "Conversation",
        "analysisInput": {
            "conversationItem": {
                "id": "1",
                "participantId": "1",
                "text": assessment
            }
        },
        "parameters": {
            "projectName": PROJECT_NAME,
            "deploymentName": DEPLOYMENT_NAME,
            "stringIndexType": "TextElement_V8"
        }
    };

    try {
        const response = await fetch(ENDPOINT, { "method": "POST", "headers": headers, "body": JSON.stringify(requestBody) });
        if (!response.ok) {
            console.log('Error with request: ' + response.statusText);
            io.to(socketId).emit('Error', 'Sorry, I had problems with the request. ' + response.statusText);
        }
        const data = await response.json();
        console.log("Received data: " + JSON.stringify(data));

        // Check if the relevant properties exist
        if (!data.result.prediction.topIntent ||
            !data.result.prediction.entities ||
            data.result.prediction.entities.length == 0 ||
            !data.result.prediction.entities[0].text) {
            console.log('Missing query, intent or entity: ');
            console.log(data);
            io.to(socketId).emit('Error', 'Sorry, I could not understand that. [No intent or entity identified]');
            return;
        }

        const topIntent = data.result.prediction.topIntent;
        const topEntity = data.result.prediction.entities[0].text;

        console.log(`Query: ${data.result.query}`);
        console.log(`Top Intent: ${topIntent}`);
        console.log(`Entity text: ${topEntity}`);

        io.to(socketId).emit(topIntent, topEntity);
    } catch (error) {
        console.log(error);
        io.to(socketId).emit('Error', 'Error understanding your assessment: ' + error);
    }

}


httpServer.listen(PORT, () => console.log(`Vital Signs Checklist server listening on port ${PORT}!`));
