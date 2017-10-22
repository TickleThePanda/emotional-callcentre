const CONST = require('./request-constants.js');
const RequestMessage = require("./request-message.js");

const generateUuid = require('uuid/v4');

module.exports = class RequestGenerator {

  constructor() {
    this.requestId = generateUuid().replace(/-/g, '');
  }

  generateBaseRequest(path, payload) {
    let type = payload instanceof Buffer ? "binary" : "text";

    let contentHeader;
    if (type === "binary") {
      contentHeader = CONST.AUDIO_TYPE;
    } else {
      contentHeader = CONST.JSON_TYPE;
    }

    let headers = {
      "Path": path,
      "X-RequestId": this.requestId,
      "X-Timestamp": new Date().toISOString(),
      "Content-Type": contentHeader
    };

    return new RequestMessage(headers, type, payload);
  }

  generateRiffRequest() {
    return this.generateBaseRequest('audio', CONST.RIFF);
  }

  generateSetupRequest() {
    return this.generateBaseRequest('setup.config', CONST.SETUP_REQUEST);
  }

  generateAudioRequest(payload) {
    return this.generateBaseRequest('audio', payload);
  }
}
