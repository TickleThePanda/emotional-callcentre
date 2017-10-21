const CONST = require('./request-constants.js');

const generateUuid = require('uuid/v4');
const requestId = generateUuid().replace(/-/g, '');


module.exports = class RawMessageBuilder {
  
    createBaseHeader(path, type) {
      let uuid = requestId;
      let timestamp = new Date().toISOString();
      let baseHeaders = "Path: " + path + CONST.HEADER_SEPARATOR
          + "X-RequestId: " + uuid + CONST.HEADER_SEPARATOR
          + "X-Timestamp: " + timestamp + CONST.HEADER_SEPARATOR
          + "Content-Type: " + type + CONST.HEADER_SEPARATOR;
    
      return baseHeaders;
    }
  
    buildFirstMessage() {
      let payload = this.createBaseHeader("speech.config", "application/json; charset=utf-8")
          + CONST.HEADER_SEPARATOR
          + `{"context":{"system":{"version":"2.0.12341"},"os":{"platform":"N/A","name":"N/A","version":"N/A"},"device":{"manufacturer":"N/A","model":"N/A","version":"N/A"}}}`;
    
      return payload;
    }
  
    buildAudioMessage(content) {
      let headers = this.createBaseHeader("audio", "audio/x-wav");
      
      let headersArray = new Buffer(headers);
    
      let buffer = new ArrayBuffer(2 + headersArray.length + content.length);
    
      let sizeDataView = new DataView(buffer, 0, 2);
      let headersDataView = new DataView(buffer, 2, headersArray.length);
      let contentDataView = new DataView(buffer,
        2 + headersArray.length,
        content.length);
    
      sizeDataView.setUint16(0, headersArray.length);
    
      for(let i = 0; i < headersArray.length; i++) {
        headersDataView.setUint8(i, headersArray[i]);
      }
    
      for(let i = 0; i < content.length; i++) {
        contentDataView.setUint8(i, content[i]);
      }
    
      return buffer;
    }
  
    buildRiffMessage() {
      return this.buildAudioMessage(CONST.RIFF);
    }
  
  }