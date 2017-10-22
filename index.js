const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const SpeechToTextClient = require('./speech-client.js');

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

app.ws('/connect', function(ws, req) {
  console.log("phone call connected to us");
  const client = new SpeechToTextClient(process.env.WATSON_USERNAME, process.env.WATSON_PASSWORD);
  client.connect().then(() => {
    let history = "";
    client.on('message', m => {
      let text = convert(m);
      if (text) {
        history += text.trim() + ". ";
        console.log(history);
      }
    });
  
    ws.on('message', function(msg) {
      if (msg instanceof String) {
        console.log("recieved text from", msg);
      } else if(msg instanceof Buffer) {
        client.sendMessage(msg);
      }
    });

    ws.on('close', client.close);
  });;


});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});