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

const Peer = require('simple-peer');
//const wrtc = require('wrtc');

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
const socketToRecognitionStream = {};

io.on('connection', socket => {
    // let recognizeStream = null;

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

        // fs.writeFileSync('./transcripts/' + socketToRoom[socket.id] + '.txt', '', { flag: "a+",  encoding: "utf8" });
        
        startRecognitionStream(socket);
        console.log(`User ${socket.id} has joined the room`);

        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
      console.log(`Disconnecting ${socket.id} from the room`);
      const roomID = socketToRoom[socket.id];
      let room = users[roomID];
      if (room) {
          room = room.filter(id => id !== socket.id);
          users[roomID] = room;
      }

      stopRecognitionStream(socket);
    });

    socket.on('binaryAudioData', function(data) {
      // console.log('Room - received audio');
      // fs.writeFileSync('./transcripts/' + socketToRoom[socket.id] + '.txt', createMessage('Audio', 'Audio received'), { flag: "a+",  encoding: "utf8" });
      receiveData(data, socket);
    })

    socket.on('textMessage', function(data) {
      users[socketToRoom[socket.id]].forEach(socketId => {
        io.to(socketId).emit('speechData',
        { results: [{alternatives: [{transcript: data}]}],
          speakerIndex: users[socketToRoom[socket.id]].indexOf(socket.id) + 1,
          userId: socket.id});
      });
    })

    function startRecognitionStream(client) {
      var recognizeStream = speechClient.streamingRecognize(request)
          .on('error', (err) => {
              console.error('Error when processing audio: ' + (err && err.code ? 'Code: ' + err.code + ' ' : '') + (err && err.details ? err.details : ''));
              console.error('Error dump:');
              console.error(err);
              client.emit('googleCloudStreamError', err);
              // stopRecognitionStream();
              console.log('Attempting to restart stream.')
              startRecognitionStream(client);
          })
          .on('data', (data) => {
              console.log('Response from Google');
              const responseStr = data.results[0].alternatives.map(alt => alt.transcript).join(" ")
              console.log(request);
              // fs.writeFileSync('./transcripts/' + socketToRoom[client.id] + '.txt', createMessage('Response', responseStr), { flag: "a+",  encoding: "utf8" });

              // send transcript to everyone
              data['speakerIndex'] = users[socketToRoom[client.id]].indexOf(client.id) + 1;
              data['userId'] = client.id;
              users[socketToRoom[client.id]].forEach(socketId => {
                io.to(socketId).emit('speechData', data);
              });
              // client.emit('speechData', data);

              // if end of utterance, let's restart stream
              // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
              // if (data.results[0] && data.results[0].isFinal) {
              //     stopRecognitionStream();
              //     startRecognitionStream(client, GCSServiceAccount, request);
              //     // console.log('restarted stream serverside');
              // }
          });

          socketToRecognitionStream[client.id] = recognizeStream;
      }

    function stopRecognitionStream(socket) {
      if (socketToRecognitionStream[socket.id]) {
        socketToRecognitionStream[socket.id].end();
      }
      
      socketToRecognitionStream[socket.id] = null;
      delete socketToRecognitionStream[socket.id];
    }

    function receiveData(data, socket) {
        if (socketToRecognitionStream[socket.id]) {
          socketToRecognitionStream[socket.id].write(data);
        } else {
          console.warn("Recognition stream is undefined. Stopping the stream for " + socket.id);
          stopRecognitionStream(socket);
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
app.use(express.static(path.resolve(__dirname, '../client/build')));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

// if (process.env.PROD) {
//     app.use(express.static(path.resolve(__dirname, '../client/build')));
//     app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
//     });
// }

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