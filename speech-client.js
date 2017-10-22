const request = require('request');
const WebSocket = require('ws');

module.exports = class SpeechToTextClient {

  constructor(name, password) {
    this.name = name;
    this.password = password;
    this.listeners = {};
    this.URL = 'wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?model=en-GB_NarrowbandModel';
  }

  connect() {
    return new Promise((resolve, reject) => {
      let headers = {
        "Authorization": 'Basic ' + new Buffer(this.name + ':' + this.password).toString('base64')
      };

      let options = {
        headers: headers
      };

      console.log('connecting to web socket', options);

      this.wsc = new WebSocket(this.URL, options);

      this.wsc.on('open', (...args) => {
        console.log("opened web socket to client", args);

        this.sendMessage('{"action":"start","content-type":"audio/l16;rate=16000", "interim_results": true}', resolve);
      });

      this.wsc.on('close', (...args) => console.log("closed with code", args));

      this.wsc.on('message', (raw) => {
        console.log('recieved message from watson');
        let message = JSON.parse(raw);
        if(this.listeners['message']) {
          this.listeners['message'].forEach(f => f(message));
        }
        if(this.listeners[message.type]) {
          this.listeners[message.type].forEach(f => f(message));
        }
      });
    });
  }

  on(type, f) {
    if(!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(f);
  }

  sendMessage(message, callback) {
    this.wsc.send(message, callback);
  }

  close() {
    try {
      this.wsc.terminate();
    } catch (e) {
      console.log(e);
    }
  }
}
