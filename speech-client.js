const request = require('request');
const WebSocket = require('ws');
const generateUuid = require('uuid/v4');

const headerSeparator = "\r\n";

const createBaseHeader = function(path) {
  let uuid = generateUuid().replace(/-/g, '');
  let timestamp = new Date().toISOString();
  let baseHeaders = "Path: " + path + headerSeparator
      + "X-RequestId: " + uuid + headerSeparator
      + "X-Timestamp: " + timestamp + headerSeparator
      + "Content-Type: " + "application/json; charset=utf-8" + headerSeparator;

  return baseHeaders;
}

const buildFirstMessage = function() {
  let payload = createBaseHeader("speech.config")
      + headerSeparator
      + `{"context":{"system":{"version":"2.0.12341"},"os":{"platform":"N/A","name":"N/A","version":"N/A"},"device":{"manufacturer":"N/A","model":"N/A","version":"N/A"}}}`;

  return payload;
}

const buildRiffMessage = function() {
  let headers = createBaseHeader("audio");
  let riff = "RIFF$   WAVEfmt      D¬  ˆX   data    ";

  let sizeArray = UInt8Array.of([headers.length]);
  let headersArray = new TextEncoder("us-ascii").encode(headers);
  let riffArray = new TextEncoder("us-ascii").encode(riff);

  let payload = new UInt8Array(2 + headersArray.length + riffArray.length);


  payload.set(size);
  payload.set(headersArray, 2);
  payload.set(riffArray, 2 + headersArray.length);

  return payload;
}

const buildBinaryMessage = function(content) {
  let headers = createBaseHeader("audio");

}

module.exports = class SpeechToTextClient {

  constructor(key) {
    this.key = key;
    this.TOKEN_ENDPOINT = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken';
    this.SPEECH_PATH = '/speech/recognition/dictation/cognitiveservices/v1';
    this.SPEECH_ENDPOINT = 'wss://speech.platform.bing.com' + this.SPEECH_PATH + '?language=en-US';
  }

  renewToken() {
    let options = {
      url: this.TOKEN_ENDPOINT,
      headers: {
        'Ocp-Apim-Subscription-Key': this.key
      }
    }

    return new Promise((resolve, reject) => {
      request.post(options, (error, res, body) => {
        if (error) {
          return reject(error);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`request failed for speech client with status code ${res.statusCode}.`));
        }

        resolve(body);
      });
    });
  }

  connect() {
    return this.renewToken()
        .then(token => {
          return new Promise((resolve, reject) => {

            let headers = {
              'Authorization': token
            };

            let options = {
              headers: headers
            };

            console.log('connecting to web socket', options);

            this.wsc = new WebSocket(this.SPEECH_ENDPOINT, options);

            this.wsc.on('open', (...args) => {
              console.log("opened web socket to client", args);

              let payload = buildFirstMessage();

              console.log('sending speech.config payload', payload);

              this.wsc.send(payload);

              this.wsc.send(buildRiffHeader(), () => resolve)
            });

            this.wsc.on('close', (...args) => console.log("closed with code", args));

            this.wsc.on('message', (...args) => console.log("message: ", args));
          });
        })
        .catch(e => {
          console.log("couldn't connect to service", e);
        });
  }

  close() {
    this.wsc.terminate();
  }

  send(buffer) {
    console.log('sending', buffer);
    this.wsc.send(buffer);
  }
}
