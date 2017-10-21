const request = require('request');
const WebSocket = require('ws');

const RawRequestBuilder = require('./raw-request-builder.js');
const RawRequestConverter = require('./raw-request-converter.js');

const builder = new RawRequestBuilder();
const converter = new RawRequestConverter();

module.exports = class SpeechToTextClient {

  constructor(key) {
    this.key = key;
    this.listeners = {};
    this.TOKEN_ENDPOINT = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken';
    this.SPEECH_PATH = '/speech/recognition/interactive/cognitiveservices/v1';
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
    this.renewToken()
        .then(token => {
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

            this.wsc.send(builder.buildFirstMessage());

            this.wsc.send(builder.buildRiffMessage(), () => this.ready = true);

          });

          this.wsc.on('close', (...args) => console.log("closed with code", args));

          this.wsc.on('message', (raw) => {
            let message = converter.convert(raw);
            let type = message.headers["Path"];
            if(this.listeners['message']) {
              this.listeners['message'].forEach(f => f(message));
            }
            if(this.listeners[type]) {
              this.listeners[type].forEach(f => f(message));
            }
          });
        })
        .catch(e => {
          console.log("couldn't connect to service", e);
        });
  }

  on(type, f) {
    if(!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(f);
  }

  send(buffer) {

    this.wsc.send(builder.buildAudioMessage(buffer));
  }

  close() {
    try {
      this.wsc.terminate();
    } catch (e) {
      console.log(e);
    }
  }
}
