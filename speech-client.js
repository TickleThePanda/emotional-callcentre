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

  recognise(stream) {
    this.renewToken()
      .then(token => {
        let headers = {
          'Authorization': "Bearer: " + token
        };

        let options = {
          headers: headers
        };

        const ws = new WebSocket(this.SPEECH_ENDPOINT, options);

        ws.on('connection', ws => {
          ws.on('message', console.log);
        });
      })
      .catch(e => {
        console.log("couldn't connect to service", e);
      });;
  }
}