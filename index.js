const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const SpeechToTextClient = require('./speech-client.js');

const request = require('request');

app.set('port', (process.env.PORT || 5000));

app.all('/answer', function(req, res, next) {
  console.log('we should answer a call ', req.url, req.body);
  res.sendFile(__dirname + "/ncco.json");
});

app.all('/events', function(req, res, next) {
  console.log('an event happened from nexmo ', req.url, req.body);
  res.status(200);
});

app.get("/", function(req, res, next) {
  res.sendFile(__dirname + "/index.html");
})

class History {

  constructor() {
    this.real = "";
    this.temp = "";
  }

  convert(message) {
    if(message.results) {
      let result = message.results[0];
      if(result.alternatives) {
        let alternatives = result.alternatives;
        if(alternatives[0]) {
          let alternative = alternatives[0];
          if(alternative) {
            return {
              transcript: alternative.transcript.trim(),
              final: result.final
            }
          }
        }
      }
    }
    return null;
  }

  add(message) {
    let data = this.convert(message);
    if(data) {
      if(data.final) {
        this.real += data.transcript + ". ";
      } else {
        this.temp = this.real + data.transcript + ". "
      }
    }
  }

}


const doAnalysis = function(text) {
  return new Promise((resolve, reject) => {
    let headers = {
      'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_TEXT_ANALYTICS_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    let options = {
      url: 'https://westeurope.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
      headers: headers,
      json: true,
      body: {
        documents: [
          {
            language: 'en',
            id: 1,
            text: text
          }
        ]
      }
    }

    request.post(options, (error, response, body) => {
      console.log("recieved information from microsoft");
      let score = body.documents[0].score;
      resolve({
        text: text,
        score: score
      });
    })
  });
}

const listeners = [];

app.ws('/connect', function(ws, req) {
  console.log("phone call connected to us");
  const client = new SpeechToTextClient(process.env.WATSON_USERNAME, process.env.WATSON_PASSWORD);
  client.connect().then(() => {
    let history = new History();
    client.on('message', m => {
      history.add(m);
      if(history.temp !== "") {
        doAnalysis(history.temp).then(t => {
          console.log("sending history to browser", history.temp);
          listeners.forEach(f => f(t));
        }).catch(console.log);
      }
    });
  
    ws.on('message', function(msg) {
      if (msg instanceof String) {
        console.log("recieved text from", msg);
      } else if(msg instanceof Buffer) {
        client.sendMessage(msg);
      }
    });

    ws.on('close', () => client.close());
  });;
});

app.ws('/browser', function(ws, req) {

  console.log('browser connected')

  let listener = t => {
    ws.send(JSON.stringify(t));
  };

  listeners.push(listener);
  ws.on('close', () => {
    console.log('browser disconnected');
    delete listeners[listeners.indexOf(listener)];
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});