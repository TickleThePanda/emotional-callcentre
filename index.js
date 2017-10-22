const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const SpeechToTextClient = require('./speech-client.js');

const RequestGenerator = require('./request-generator.js');

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

app.ws('/connect', function(ws, req) {
  console.log("phone call connected to us");
  const generator = new RequestGenerator();
  const client = new SpeechToTextClient(process.env.SPEECH_KEY, generator);
  client.connect();

  client.on('message', m => {
    console.log(m);
  });

  let missedMessages = [];

  ws.on('message', function(msg) {
    if (msg instanceof String) {
      console.log(msg);
    } else if(msg instanceof Buffer) {
      console.log(msg.length);
      ws.send(msg);
      if(!client.ready) {
        missedMessages.push(generator.generateAudioRequest(msg));
      } else {
        while(missedMessages.length) {
          client.sendMessage(missedMessages.shift());
        }
        client.sendMessage(generator.generateAudioRequest(msg));
      }
    }
  });
  ws.on('close', client.close);

});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});