class Socket {
  constructor() {
    this.writable = true;
    this.readable = true;
  }
  connect() { return this; }
  on() { return this; }
  once() { return this; }
  emit() { return false; }
  write() { return true; }
  end() { return this; }
  destroy() { return this; }
  setTimeout() { return this; }
  setNoDelay() { return this; }
  setKeepAlive() { return this; }
}

module.exports = {
  Socket,
  createConnection: () => new Socket(),
  connect: () => new Socket(),
  isIP: () => 0,
  isIPv4: () => false,
  isIPv6: () => false,
  Server: class Server {},
  createServer: () => new module.exports.Server(),
};
