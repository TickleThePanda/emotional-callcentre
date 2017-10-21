var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

app.get("/ncco", function(req, res, next) {
  res.sendFile("/ncco.json")
});

app.ws('/connect', function(ws, req) {
  ws.on('message', function(msg) {
    if (msg.type === 'utf8') {
      console.log(message.utf8Data);
    } else if(message.type === 'binary') {
      console.log("Binary message recieved");
      connection.sendBytes(message.binaryData);
    }
  });
});

app.listen();