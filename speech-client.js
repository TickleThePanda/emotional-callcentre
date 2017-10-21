const request = require('request');
const WebSocket = require('ws');
const generateUuid = require('uuid/v4');

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

            let uuid = generateUuid().replace(/-/g, '');
            let timestamp = new Date().toISOString();

            let headers = {
              'Authorization': "Bearer " + token,
              'Path': this.SPEECH_PATH,
              'X-RequestId': uuid,
              'X-Timestamp': timestamp
            };

            let options = {
              headers: headers
            };

            console.log('connecting to web socket', options);

            this.wsc = new WebSocket(this.SPEECH_ENDPOINT, options);

            this.wsc.on('open', (...args) => {
              console.log("opened web socket to client", args);
              resolve();
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