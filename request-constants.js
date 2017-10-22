const fs = require('fs');

module.exports.RIFF = fs.readFileSync(__dirname + "/riff.wav");
module.exports.HEADER_SEPARATOR = "\r\n";
module.exports.SETUP_REQUEST = '{"context":{"system":{"version":"2.0.12341"},"os":{"platform":"Linux","name":"Debian","version":"2.14324324"},"device":{"manufacturer":"Contoso","model":"Fabrikan","version":"7.341"}}}';
module.exports.AUDIO_TYPE = "audio/x-wav";
module.exports.JSON_TYPE = "application/json; charset=utf-8";
