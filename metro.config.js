const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  path: require.resolve('path-browserify'),
  buffer: require.resolve('buffer'),
  util: require.resolve('util/'),
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  events: require.resolve('events/'),
  assert: require.resolve('assert/'),
  websocket: require.resolve('websocket/lib/browser.js'),
  net: path.resolve(__dirname, 'shims/net.js'),
  tls: path.resolve(__dirname, 'shims/tls.js'),
  fs: path.resolve(__dirname, 'shims/fs.js'),
  os: path.resolve(__dirname, 'shims/os.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'node-localstorage') {
    return {
      filePath: path.resolve(__dirname, 'shims/localStorage.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
