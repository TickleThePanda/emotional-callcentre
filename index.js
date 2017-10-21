var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

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
  ws.on('message', function(msg) {
    console.log(msg);
    if (msg instanceof String) {
      console.log(msg);
    } else if(msg instanceof Buffer) {
      console.log("Binary message recieved");
      ws.sendBytes(msg);
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});