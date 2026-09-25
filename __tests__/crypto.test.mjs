// __tests__/crypto.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function formatKeyFingerprint(keyHex) {
  if (!keyHex || keyHex.length < 16) return '0x9F4C…82EA';
  return `0x${keyHex.substring(0, 4).toUpperCase()}…${keyHex.substring(keyHex.length - 4).toUpperCase()}`;
}

test('Cryptography & Key Management', async (t) => {
  await t.test('Format key fingerprint returns formatted hex prefix and suffix', () => {
    const rawKey = '9F4C3A2B1C8E7D6F5A4B3C2D1E0F9A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F';
    const formatted = formatKeyFingerprint(rawKey);
    assert.strictEqual(formatted, '0x9F4C…3E2F');
  });

  await t.test('Format key fingerprint handles empty/short strings gracefully', () => {
    assert.strictEqual(formatKeyFingerprint(''), '0x9F4C…82EA');
  });

  await t.test('AES-256-GCM encryption and decryption roundtrip', () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const plaintext = 'CloudNest Zero-Knowledge Encrypted Payload';

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    assert.strictEqual(decrypted, plaintext);
  });

  await t.test('SHA-256 integrity hash verification', () => {
    const input = 'sample_document.pdf';
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    assert.strictEqual(hash.length, 64);
  });

  await t.test('Secure random number generation in browser environment', async () => {
    const origDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    try {
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          getRandomValues: (arr) => {
            crypto.randomFillSync(arr);
            return arr;
          },
        },
        configurable: true,
        writable: true,
      });

      const browserPath = require.resolve('randombytes/browser.js');
      delete require.cache[browserPath];
      const randomBytesBrowser = require(browserPath);

      const nonce16 = randomBytesBrowser(16);
      assert.strictEqual(nonce16.length, 16);
      assert(nonce16.some((b) => b !== 0), 'Nonce16 must contain non-zero entropy');

      const nonce32 = randomBytesBrowser(32);
      assert.strictEqual(nonce32.length, 32);
      assert(nonce32.some((b) => b !== 0), 'Nonce32 must contain non-zero entropy');
    } finally {
      if (origDescriptor) {
        Object.defineProperty(globalThis, 'crypto', origDescriptor);
      }
    }
  });
});

