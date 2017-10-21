const CONST = require('./request-constants.js');

module.exports = class RawRequestConverter {
  convert(raw) {
    let split = raw.split(CONST.HEADER_SEPARATOR + CONST.HEADER_SEPARATOR);
    let headersAsText = split[0];
    let payloadAsText = split[1];
    let headers = headersAsText
        .split(CONST.HEADER_SEPARATOR)
        .reduce((map, obj) => {
          let headerSplit = obj.split(":");
          map[headerSplit[0].trim()] = headerSplit[1].trim();
          return map;
        }, {});
    let payload = JSON.parse(payloadAsText);

    return {
      headers,
      payload
    };
  }
}