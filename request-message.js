module.exports = class RequestMessage {
  constructor(headers, type, payload) {
    this.headers = headers;
    this.type = type;
    this.payload = payload;
  }
}