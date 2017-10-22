const fs = require('fs');

module.exports.RIFF = fs.readFileSync(__dirname + "/riff.wav");
module.exports.HEADER_SEPARATOR = "\r\n";
module.exports.SETUP_REQUEST = '{"context":{"system":{"version":"2.0.12341"},"os":{"platform":"N/A","name":"N/A","version":"N/A"},"device":{"manufacturer":"N/A","model":"N/A","version":"N/A"}}}';
module.exports.AUDIO_TYPE = "audio/x-wav";
module.exports.JSON_TYPE = "application/json; charset=utf-8";
