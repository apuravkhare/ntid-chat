require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require("path");
// const recorder = require('node-record-lpcm16');
const fs = require('fs');


/* Google Speech to Text Setup */
// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

// Creates a client
const speechClient = new speech.SpeechClient();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US'; //en-US

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    profanityFilter: false,
    enableWordTimeOffsets: true,
  },
  interimResults: true, // If you want interim results, set this to true
};
  
/* Socket.io setup */  
const users = {};
const socketToRoom = {};

io.on('connection', socket => {
    let recognizeStream = null;

    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 3) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        fs.writeFileSync('./transcripts/' + socketToRoom[socket.id] + '.txt', '', { flag: "a+",  encoding: "utf8" });
        // fs.writeFile('./transcripts/' + socketToRoom[socket.id] + '.txt', '', { flag: "a",  encoding: "utf8" }, () => {
        //     console.log('File created');
        // });

        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        startRecognitionStream(socket);
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
    });

    socket.on('binaryAudioData', function(data) {
        fs.writeFileSync('./transcripts/' + socketToRoom[socket.id] + '.txt', createMessage('Audio', 'Audio received'), { flag: "a+",  encoding: "utf8" });
        // fs.writeFile('/transcripts/' + socketToRoom[socket.id] + '.txt', createMessage('Audio received'), { flag: "a",  encoding: "utf8" }, () => {
        //     console.log('Log appended');
        // });

        receiveData(data);
    })

    // var LIMIT = 0;
    // const messages = [];
    function startRecognitionStream(client) {
        // console.log("Response from Google");

        // Uncomment to run test code
        // setTimeout(() => {
        //     messages.push("hello " + LIMIT);
        //     client.emit('speechData', {"results":[{"alternatives":[{"words":[],"transcript":messages.join(" "),"confidence":0}],"isFinal":false,"stability":0.009999999776482582,"resultEndTime":{"seconds":"3","nanos":200000000},"channelTag":0,"languageCode":""}],"error":null,"speechEventType":"SPEECH_EVENT_UNSPECIFIED"});
        //     if (LIMIT < 500) {
        //         startRecognitionStream(client);
        //         LIMIT++;
        //     }
        // }, 100);

        // Uncomment to begin speech to text
        recognizeStream = speechClient.streamingRecognize(request)
            .on('error', (err) => {
                console.error('Error when processing audio: ' + (err && err.code ? 'Code: ' + err.code + ' ' : '') + (err && err.details ? err.details : ''));
                client.emit('googleCloudStreamError', err);
                stopRecognitionStream();
            })
            .on('data', (data) => {
                console.log('Response from Google');
                const responseStr = data.results[0].alternatives.map(alt => alt.transcript).join(" ")
                console.log(request);
                fs.writeFileSync('./transcripts/' + socketToRoom[client.id] + '.txt', createMessage('Response', responseStr), { flag: "a+",  encoding: "utf8" });
                // fs.writeFile('/transcripts/' + socketToRoom[client.id] + '.txt', createMessage(responseStr), { flag: "a",  encoding: "utf8" }, () => {
                //     console.log('Log created');
                // });

                client.emit('speechData', data);

                // if end of utterance, let's restart stream
                // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
                // if (data.results[0] && data.results[0].isFinal) {
                //     stopRecognitionStream();
                //     startRecognitionStream(client, GCSServiceAccount, request);
                //     // console.log('restarted stream serverside');
                // }
            });
      }

    function stopRecognitionStream() {
        if (recognizeStream) {
            recognizeStream.end();
        }
        recognizeStream = null;
    }

    function receiveData(data) {
        if (recognizeStream) {
            recognizeStream.write(data);
        }
    }

    function createMessage(type, message) {
        return getFormattedDate() + '\t' + type + '\t' + message + '\n';
    }

    function getFormattedDate() {
        return new Date().toISOString();
    }

});

// function startRecognitionStream(client, GCSServiceAccount, request) {
//     client.emit('speechData', "This is a test");
// }

// For deployment
if (process.env.PROD) {
    app.use(express.static(path.join(__dirname, './client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, './client/build/index.html'));
    });
}

const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`Server is up on port ${port}`));
/*
https://cloud.google.com/dotnet/docs/reference/Google.Cloud.Speech.V1/latest/Google.Cloud.Speech.V1.SpeechRecognitionAlternative
{
    "results": [
      {
        "alternatives": [
          {
            "words": [
              {
                "startTime": {
                  "seconds": "14",
                  "nanos": 500000000
                },
                "endTime": {
                  "seconds": "15",
                  "nanos": 100000000
                },
                "word": "test",
                "speakerTag": 0
              }
            ],
            "transcript": " test",
            "confidence": 0.8717851638793945
          }
        ],
        "isFinal": true,
        "stability": 0,
        "resultEndTime": {
          "seconds": "15",
          "nanos": 620000000
        },
        "channelTag": 0,
        "languageCode": ""
      }
    ],
    "error": null,
    "speechEventType": "SPEECH_EVENT_UNSPECIFIED",
    "totalBilledTime": {
      "seconds": "30",
      "nanos": 0
    }
  }
  */