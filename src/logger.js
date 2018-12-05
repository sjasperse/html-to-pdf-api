let EventEmitter = require('events');
let eventEmitter = new EventEmitter();

module.exports = {
  info: info,
  error: error,

  onMessage: (cb) => eventEmitter.on('message', cb)
}

function info (message) {
  console.log(message);

  eventEmitter.emit('message', { level: "info", message: message });
}

function error(message) {
  console.error(message);

  eventEmitter.emit('message', { level: "error", message: message });  
}