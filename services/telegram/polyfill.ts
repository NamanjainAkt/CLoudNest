// services/telegram/polyfill.ts
// Comprehensive runtime polyfill for GramJS MTProto & Node libraries in React Native (Hermes)
import { Buffer } from 'buffer';

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

// 2. Global Process (Required by readable-stream, stream-browserify, hash-base)
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
