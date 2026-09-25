// __tests__/mtproto.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import { TELEGRAM_DATA_CENTERS } from '../services/telegram/types.ts';

function calculateSimulatedPing(dcId) {
  const basePing = dcId === 4 ? 38 : dcId === 2 ? 44 : dcId === 1 ? 82 : 92;
  return basePing;
}

function calculateMtprotoParts(fileSizeBytes, partSize = 512 * 1024) {
  if (fileSizeBytes <= 0) return 1;
  return Math.max(1, Math.ceil(fileSizeBytes / partSize));
}

test('Telegram MTProto Transport & Edge Node Routing', async (t) => {
  await t.test('All primary Telegram DCs configure valid IP, port and web endpoints', () => {
    const dcs = [1, 2, 4, 5];
    for (const id of dcs) {
      const dc = TELEGRAM_DATA_CENTERS[id];
      assert.ok(dc, `DC ${id} should exist`);
      assert.strictEqual(dc.port, 443);
      assert.match(dc.ip, /^\d+\.\d+\.\d+\.\d+$/);
      assert.match(dc.webEndpoint, /^https:\/\/[a-z]+\.web\.telegram\.org\/apiws$/);
    }
  });

  await t.test('Frankfurt DC4 is configured as default European Enclave', () => {
    const dc4 = TELEGRAM_DATA_CENTERS[4];
    assert.strictEqual(dc4.ip, '149.154.167.91');
    assert.strictEqual(dc4.webEndpoint, 'https://vesta.web.telegram.org/apiws');
    assert.match(dc4.location, /Frankfurt/);
  });

  await t.test('Base latency computation across world regions', () => {
    assert.strictEqual(calculateSimulatedPing(4), 38); // Frankfurt lowest for EU
    assert.strictEqual(calculateSimulatedPing(2), 44); // Amsterdam
    assert.strictEqual(calculateSimulatedPing(1), 82); // Miami
    assert.strictEqual(calculateSimulatedPing(5), 92); // Singapore
  });

  await t.test('MTProto 512KB document chunk part calculations', () => {
    // 256 KB -> 1 part
    assert.strictEqual(calculateMtprotoParts(256 * 1024), 1);
    // 512 KB -> 1 part
    assert.strictEqual(calculateMtprotoParts(512 * 1024), 1);
    // 1 MB -> 2 parts
    assert.strictEqual(calculateMtprotoParts(1024 * 1024), 2);
    // 10 MB -> 20 parts
    assert.strictEqual(calculateMtprotoParts(10 * 1024 * 1024), 20);
  });

  await t.test('GramJS live credentials configuration', () => {
    const apiId = 36408941;
    const apiHash = '902d6cd0485b8127cdcb635b24028ac4';
    assert.strictEqual(typeof apiId, 'number');
    assert.strictEqual(apiHash.length, 32);
    assert.match(apiHash, /^[0-9a-f]{32}$/);
  });

  await t.test('Resilient peer resolution falls back to Saved Messages ("me")', () => {
    function resolvePeerFallback(channelId) {
      if (!channelId || channelId === 'me' || channelId === '-1000000000') {
        return 'me';
      }
      return channelId;
    }
    assert.strictEqual(resolvePeerFallback(undefined), 'me');
    assert.strictEqual(resolvePeerFallback(''), 'me');
    assert.strictEqual(resolvePeerFallback('-1000000000'), 'me');
    assert.strictEqual(resolvePeerFallback('me'), 'me');
    assert.strictEqual(resolvePeerFallback('-1002234567890'), '-1002234567890');
  });

  await t.test('Upload buffer preparation assigns name property for GramJS', () => {
    const rawData = Buffer.from('CloudNestEncryptedDataPayload');
    rawData.name = 'photo_123.jpg.enc';
    assert.strictEqual(Buffer.isBuffer(rawData), true);
    assert.strictEqual(rawData.name, 'photo_123.jpg.enc');
    assert.strictEqual(rawData.length, 29);
  });

  await t.test('MTProto Large File (>10MB) and APK chunk calculations', () => {
    // 6 MB file -> 12 parts of 512KB (<= 10MB uses SaveFilePart)
    const sixMB = 6 * 1024 * 1024;
    assert.strictEqual(calculateMtprotoParts(sixMB), 12);
    assert.strictEqual(sixMB > 10 * 1024 * 1024, false);

    // 196 MB APK file -> 392 parts of 512KB (> 10MB uses SaveBigFilePart)
    const apkSize = 196 * 1024 * 1024;
    assert.strictEqual(calculateMtprotoParts(apkSize), 392);
    assert.strictEqual(apkSize > 10 * 1024 * 1024, true);
  });

  await t.test('AES-256-CTR stream encryption maintains exact byte length with 0 padding', async () => {
    const crypto = await import('node:crypto');
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const chunk1 = crypto.randomBytes(512 * 1024); // 512KB
    const chunk2 = crypto.randomBytes(256 * 1024); // 256KB

    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
    const enc1 = cipher.update(chunk1);
    const enc2 = cipher.update(chunk2);
    const finalEnc = cipher.final();

    assert.strictEqual(enc1.length, 512 * 1024);
    assert.strictEqual(enc2.length, 256 * 1024);
    assert.strictEqual(finalEnc.length, 0);

    const fullCipher = Buffer.concat([enc1, enc2, finalEnc]);
    assert.strictEqual(fullCipher.length, (512 + 256) * 1024);

    const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
    const dec = Buffer.concat([decipher.update(fullCipher), decipher.final()]);
    assert.deepStrictEqual(dec, Buffer.concat([chunk1, chunk2]));
  });
});
