const request = require('request');
const WebSocket = require('ws');

module.exports = class SpeechToTextClient {

  constructor(key) {
    this.key = key;
    this.TOKEN_ENDPOINT = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken';
    this.SPEECH_ENDPOINT = 'wss://speech.platform.bing.com/speech/recognition/dictation/cognitiveservices/v1';
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
        let headers = {
          'Authorization': "Bearer: " + token
        };

        let options = {
          headers: headers
        };

        console.log('connecting to web socket');

        this.wsc = new WebSocket(this.SPEECH_ENDPOINT, options);

        this.wsc.on('open', () => console.log("connected"));
        this.wsc.on('close', (code) => console.log("closed with code", code));

        this.wsc.on('message', (data) => console.log("message: ", data));
      })
      .catch(e => {
        console.log("couldn't connect to service", e);
      });
  }

  close() {
    this.wsc.terminate();
  }

  send(buffer) {
    this.wsc.send(buffer);
  }
}