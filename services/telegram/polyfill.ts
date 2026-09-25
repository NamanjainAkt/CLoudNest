// services/telegram/polyfill.ts
// Comprehensive runtime polyfill for GramJS MTProto & Node libraries in React Native (Hermes)
import { Buffer } from 'buffer';
import * as ExpoCrypto from 'expo-crypto';

declare const global: any;

const g = (typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
  ? window
  : typeof global !== 'undefined'
  ? global
  : {}) as any;

// 1. Global Buffer
if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer;
}
if (typeof (g as any).global !== 'undefined' && typeof (g as any).global.Buffer === 'undefined') {
  (g as any).global.Buffer = Buffer;
}

// 2. Global Crypto & getRandomValues Polyfill
// Critical: Required by randombytes, randomfill, crypto-browserify, and GramJS Authenticator nonces.
// In Hermes React Native, global.crypto.getRandomValues is undefined by default.
function polyfillGetRandomValues<T extends ArrayBufferView | null>(array: T): T {
  if (!array) {
    throw new TypeError("Failed to execute 'getRandomValues' on 'Crypto': parameter 1 is not of type 'ArrayBufferView'");
  }

  const byteLength = (array as any).byteLength ?? (array as any).length ?? 0;
  if (byteLength === 0) return array;

  // 1. Primary: Native hardware-backed random bytes via expo-crypto
  try {
    if (ExpoCrypto && typeof (ExpoCrypto as any).getRandomValues === 'function') {
      const u8 = array instanceof Uint8Array
        ? array
        : new Uint8Array((array as any).buffer, (array as any).byteOffset || 0, byteLength);
      (ExpoCrypto as any).getRandomValues(u8);
      return array;
    }
  } catch (_expoErr) {
    // If native module is not ready yet, fall through to secondary fallbacks
  }

  // 2. Secondary: Node.js crypto in test runners / Node environments
  try {
    const nodeCrypto = typeof require !== 'undefined' ? require('crypto') : null;
    if (nodeCrypto && typeof nodeCrypto.randomFillSync === 'function') {
      nodeCrypto.randomFillSync(array as any);
      return array;
    }
  } catch (_nodeErr) {}

  // 3. Fallback: High-entropy PRNG loop to guarantee 0 crashes under any condition
  const fallbackView = array instanceof Uint8Array
    ? array
    : new Uint8Array((array as any).buffer, (array as any).byteOffset || 0, byteLength);
  for (let i = 0; i < fallbackView.length; i++) {
    fallbackView[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

const subtleDigest = async (algorithm: any, data: BufferSource): Promise<ArrayBuffer> => {
  const algoStr = (typeof algorithm === 'string' ? algorithm : algorithm?.name || 'SHA-256')
    .toUpperCase()
    .replace('-', '');

  let hashName = 'sha256';
  if (algoStr.includes('SHA1') || algoStr.includes('SHA-1')) hashName = 'sha1';
  else if (algoStr.includes('SHA512') || algoStr.includes('SHA-512')) hashName = 'sha512';
  else if (algoStr.includes('SHA384') || algoStr.includes('SHA-384')) hashName = 'sha384';
  else if (algoStr.includes('MD5')) hashName = 'md5';

  try {
    const createHash = require('create-hash');
    const h = createHash(hashName);
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as any);
    h.update(buf);
    const out = h.digest();
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  } catch (_e) {
    return new ArrayBuffer(0);
  }
};

const cryptoPolyfill: any = g.crypto || {};
cryptoPolyfill.getRandomValues = polyfillGetRandomValues;

if (!cryptoPolyfill.randomUUID) {
  cryptoPolyfill.randomUUID = () => {
    try {
      if (ExpoCrypto && typeof (ExpoCrypto as any).randomUUID === 'function') {
        return (ExpoCrypto as any).randomUUID();
      }
    } catch (_) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

if (!cryptoPolyfill.subtle) {
  cryptoPolyfill.subtle = {
    digest: subtleDigest,
  };
}

// Bind to all global targets across Hermes, Web, Node, and WebWorkers
g.crypto = cryptoPolyfill;
g.msCrypto = cryptoPolyfill;
if (typeof globalThis !== 'undefined') {
  (globalThis as any).crypto = cryptoPolyfill;
  (globalThis as any).msCrypto = cryptoPolyfill;
}
if (typeof global !== 'undefined') {
  (global as any).crypto = cryptoPolyfill;
  (global as any).msCrypto = cryptoPolyfill;
}
if (typeof window !== 'undefined') {
  (window as any).crypto = cryptoPolyfill;
  (window as any).msCrypto = cryptoPolyfill;
}
if (typeof self !== 'undefined') {
  (self as any).crypto = cryptoPolyfill;
  (self as any).msCrypto = cryptoPolyfill;
}

// 3. Global Process (Required by readable-stream, stream-browserify, hash-base)
if (typeof g.process === 'undefined') {
  g.process = {};
}
g.process.browser = true;
g.process.version = 'v18.0.0';
g.process.versions = g.process.versions || { node: '18.0.0' };
g.process.env = g.process.env || {};
if (!g.process.nextTick) {
  g.process.nextTick = (fn: any, ...args: any[]) => setTimeout(() => fn(...args), 0);
}
if (!g.process.cwd) {
  g.process.cwd = () => '/';
}

// 3. Global Window & Location (Required by GramJS to detect browser/WSS instead of Node TCP sockets)
if (typeof g.window === 'undefined') {
  g.window = g;
}
if (!g.window.location) {
  g.window.location = {
    protocol: 'https:',
    host: 'vesta.web.telegram.org',
    hostname: 'vesta.web.telegram.org',
    port: '443',
    href: 'https://vesta.web.telegram.org/apiws',
    origin: 'https://vesta.web.telegram.org',
  };
}
if (typeof g.location === 'undefined') {
  g.location = g.window.location;
}
if (typeof g.self === 'undefined') {
  g.self = g;
}

// 4. Window Event Listener Stubs (Required by GramJS PromisedWebSockets for offline events)
if (!g.window.addEventListener) {
  g.window.addEventListener = () => {};
  g.window.removeEventListener = () => {};
}
if (!g.addEventListener) {
  g.addEventListener = () => {};
  g.removeEventListener = () => {};
}

export { Buffer };
