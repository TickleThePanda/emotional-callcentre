const fs = require('fs');

module.exports.RIFF = fs.readFileSync(__dirname + "/riff.wav");
module.exports.HEADER_SEPARATOR = "\r\n";