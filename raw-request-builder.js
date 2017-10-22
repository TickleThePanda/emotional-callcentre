const CONST = require('./request-constants.js');

module.exports = class RawMessageBuilder {

    buildTextRequest(headersText, payload) {
      return headersText + CONST.HEADER_SEPARATOR + payload;
    }

    buildBinaryRequest(headersText, payload) {
      let headersArray = Buffer.from(headersText);
    
      let buffer = new ArrayBuffer(2 + headersArray.length + payload.length);
    
      let sizeDataView = new DataView(buffer, 0, 2);
      let headersDataView = new DataView(buffer, 2, headersArray.length);
      let contentDataView = new DataView(buffer,
        2 + headersArray.length,
        payload.length);
    
      sizeDataView.setUint16(0, headersArray.length);
    
      for(let i = 0; i < headersArray.length; i++) {
        headersDataView.setUint8(i, headersArray[i]);
      }
    
      for(let i = 0; i < payload.length; i++) {
        contentDataView.setUint8(i, payload[i]);
      }
    
      return buffer;
    }

    buildHeaders(headers) {
      return Object.keys(headers)
        .map(k => k + ": " + headers[k])
        .reduce((map, obj) => {
          map += obj + CONST.HEADER_SEPARATOR;
          return map;
        }, "");
    }

    buildMessage(message) {

      const headerText = this.buildHeaders(message.headers);

      if(message.type === "binary") {
        return this.buildBinaryRequest(headerText, message.payload);
      } else {
        return this.buildTextRequest(headerText, message.payload);
      }

    }
  
  }