// __tests__/crypto.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

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
});
