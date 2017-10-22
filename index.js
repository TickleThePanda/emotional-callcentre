const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const SpeechToTextClient = require('./speech-client.js');

const request = require('request');

app.set('port', (process.env.PORT || 5000));

app.get('/', function(req, res, next) {
  console.log("webhook get:", req.body);
  res.status(200).send({ answer_url: "/ncco" });
});

app.post('/', function(req, res, next) {
  console.log("webhook post:", req.body);
  res.status(200).send();
});

app.get("/ncco", function(req, res, next) {
  res.sendFile(__dirname + "/ncco.json");
});

app.get("/index.html", function(req, res, next) {
  res.sendFile(__dirname + "/index.html");
})

const convert = function(message) {
  if(message.results) {
    let result = message.results[0];
    if (result.final) {
      let alternatives = result.alternatives;
      if(alternatives[0]) {
        let alternative = alternatives[0];
        if(alternative) {
          return alternative.transcript;
        }
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
      console.log(body);
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
    let history = "";
    client.on('message', m => {
      let text = convert(m);
      if (text) {
        history += text.trim() + ". ";
        doAnalysis(history).then(t => {
          console.log("sending history to browser");
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
  let listener = t => {
    ws.send(JSON.stringify(t));
  };

  listeners.push(listener);
  ws.on('close', () => {
    delete listeners[listeners.indexOf(listener)];
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});