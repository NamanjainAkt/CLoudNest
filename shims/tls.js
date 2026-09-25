const net = require('./net');

module.exports = {
  ...net,
  connect: () => new net.Socket(),
  TLSSocket: net.Socket,
};
