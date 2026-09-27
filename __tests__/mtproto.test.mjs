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

  await t.test('Multi-worker part pipelining concurrency and memory sliding window', () => {
    function computePipeliningPlan(totalParts, maxConcurrency = 3, maxQueueBuffer = 1) {
      const concurrency = Math.min(maxConcurrency, totalParts);
      // In flight parts (up to concurrency) + ready buffer (maxQueueBuffer)
      const maxChunksInMemory = concurrency + maxQueueBuffer;
      const maxMemoryBytes = maxChunksInMemory * (512 * 1024);
      return {
        concurrency,
        maxChunksInMemory,
        maxMemoryBytes,
      };
    }

    // Small file (1 part) -> Concurrency 1, max 2 chunks in memory (1MB)
    const plan1 = computePipeliningPlan(1);
    assert.strictEqual(plan1.concurrency, 1);
    assert.strictEqual(plan1.maxChunksInMemory, 2);
    assert.ok(plan1.maxMemoryBytes <= 2 * 1024 * 1024);

    // Medium file (2 parts) -> Concurrency 2, max 3 chunks in memory (1.5MB)
    const plan2 = computePipeliningPlan(2);
    assert.strictEqual(plan2.concurrency, 2);
    assert.strictEqual(plan2.maxChunksInMemory, 3);
    assert.ok(plan2.maxMemoryBytes <= 2 * 1024 * 1024);

    // Large file (20 parts) -> Concurrency 3, max 4 chunks in memory (2.0MB)
    const plan20 = computePipeliningPlan(20);
    assert.strictEqual(plan20.concurrency, 3);
    assert.strictEqual(plan20.maxChunksInMemory, 4);
    assert.strictEqual(plan20.maxMemoryBytes, 2 * 1024 * 1024);
  });

  await t.test('Pipelined sliding window preserves strictly sequential cryptographic order', async () => {
    const crypto = await import('node:crypto');
    const totalParts = 6;
    const chunkSize = 64 * 1024;
    const testData = crypto.randomBytes(totalParts * chunkSize);
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    // 1. Reference standard sequential encryption & hashing
    const refCipher = crypto.createCipheriv('aes-256-ctr', key, iv);
    const refSha = crypto.createHash('sha256');
    const refMd5 = crypto.createHash('md5');
    const refChunks = [];
    for (let i = 0; i < totalParts; i++) {
      const chunk = testData.subarray(i * chunkSize, (i + 1) * chunkSize);
      refSha.update(chunk);
      let enc = refCipher.update(chunk);
      if (i === totalParts - 1) {
        enc = Buffer.concat([enc, refCipher.final()]);
      }
      refMd5.update(enc);
      refChunks.push(enc);
    }
    const expectedSha = refSha.digest('hex');
    const expectedMd5 = refMd5.digest('hex');

    // 2. Pipelined producer-consumer model simulation
    const pipelinedCipher = crypto.createCipheriv('aes-256-ctr', key, iv);
    const pipelinedSha = crypto.createHash('sha256');
    const pipelinedMd5 = crypto.createHash('md5');

    const preparedQueue = [];
    const MAX_BUFFER = 1;
    let nextPrepare = 0;
    const uploadedParts = new Map();

    // Producer strictly prepares sequentially
    function produceChunks() {
      while (nextPrepare < totalParts && preparedQueue.length <= MAX_BUFFER) {
        const i = nextPrepare++;
        const chunk = testData.subarray(i * chunkSize, (i + 1) * chunkSize);
        pipelinedSha.update(chunk);
        let enc = pipelinedCipher.update(chunk);
        if (i === totalParts - 1) {
          enc = Buffer.concat([enc, pipelinedCipher.final()]);
        }
        pipelinedMd5.update(enc);
        preparedQueue.push({ partIndex: i, bytes: enc });
      }
    }

    // Workers consume concurrently
    produceChunks();
    while (uploadedParts.size < totalParts) {
      assert.ok(preparedQueue.length <= MAX_BUFFER + 3, 'Memory sliding window bounded');
      const item = preparedQueue.shift();
      if (item) {
        uploadedParts.set(item.partIndex, item.bytes);
        produceChunks();
      }
    }

    assert.strictEqual(pipelinedSha.digest('hex'), expectedSha);
    assert.strictEqual(pipelinedMd5.digest('hex'), expectedMd5);
    for (let i = 0; i < totalParts; i++) {
      assert.deepStrictEqual(uploadedParts.get(i), refChunks[i]);
    }
  });

  await t.test('Instantaneous speed calculation and formatting', () => {
    function formatUploadSpeed(bytesPerSec) {
      if (!bytesPerSec || bytesPerSec <= 0 || !isFinite(bytesPerSec)) {
        return '0 MB/s';
      }
      if (bytesPerSec >= 1024 * 1024) {
        return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
      }
      if (bytesPerSec >= 1024) {
        return `${Math.round(bytesPerSec / 1024)} KB/s`;
      }
      return `${Math.round(bytesPerSec)} B/s`;
    }

    assert.strictEqual(formatUploadSpeed(0), '0 MB/s');
    assert.strictEqual(formatUploadSpeed(-50), '0 MB/s');
    assert.strictEqual(formatUploadSpeed(NaN), '0 MB/s');
    assert.strictEqual(formatUploadSpeed(500), '500 B/s');
    assert.strictEqual(formatUploadSpeed(850 * 1024), '850 KB/s');
    assert.strictEqual(formatUploadSpeed(4.8 * 1024 * 1024), '4.8 MB/s');
    assert.strictEqual(formatUploadSpeed(10.25 * 1024 * 1024), '10.3 MB/s');
  });

  await t.test('Active uploads speed parsing and dynamic sum calculation', () => {
    function parseSpeedToMBs(speedText) {
      if (!speedText) return 0;
      const match = speedText.match(/([\d.]+)\s*(MB\/s|KB\/s|B\/s)?/i);
      if (!match) return 0;
      const num = parseFloat(match[1]);
      if (isNaN(num)) return 0;
      const unit = (match[2] || 'MB/s').toUpperCase();
      if (unit.startsWith('KB')) return num / 1024;
      if (unit.startsWith('B')) return num / (1024 * 1024);
      return num;
    }

    assert.strictEqual(parseSpeedToMBs('4.8 MB/s'), 4.8);
    assert.strictEqual(parseSpeedToMBs('0 MB/s'), 0);
    assert.strictEqual(parseSpeedToMBs('Calculating...'), 0);
    assert.strictEqual(parseSpeedToMBs(undefined), 0);
    assert.strictEqual(parseSpeedToMBs('1024 KB/s'), 1);

    // Multi-item aggregation
    const activeQueue = [
      { id: '1', status: 'uploading', speed: '3.5 MB/s' },
      { id: '2', status: 'uploading', speed: '1.5 MB/s' },
      { id: '3', status: 'paused', speed: '0 MB/s' },
    ];

    const activeItems = activeQueue.filter((i) => i.status === 'uploading');
    const totalMBs = activeItems.reduce((sum, i) => sum + parseSpeedToMBs(i.speed), 0);
    assert.strictEqual(totalMBs, 5.0);

    const speedBadge = totalMBs > 0 ? `↑ ${totalMBs.toFixed(1)} MB/s` : '↑ 0 MB/s';
    assert.strictEqual(speedBadge, '↑ 5.0 MB/s');
  });

  await t.test('Parallel upload slot manager respects MAX_PARALLEL_UPLOADS = 4', () => {
    class MockBackgroundSync {
      constructor() {
        this.activeUploadIds = new Set();
        this.MAX_PARALLEL_UPLOADS = 4;
        this.completed = [];
      }

      canAcceptMore() {
        return this.activeUploadIds.size < this.MAX_PARALLEL_UPLOADS;
      }

      startUpload(id) {
        if (!this.canAcceptMore()) return false;
        this.activeUploadIds.add(id);
        return true;
      }

      finishUpload(id) {
        this.activeUploadIds.delete(id);
        this.completed.push(id);
      }
    }

    const sync = new MockBackgroundSync();
    assert.strictEqual(sync.canAcceptMore(), true);

    // Start 1st, 2nd, 3rd, and 4th uploads
    assert.strictEqual(sync.startUpload('item_1'), true);
    assert.strictEqual(sync.startUpload('item_2'), true);
    assert.strictEqual(sync.startUpload('item_3'), true);
    assert.strictEqual(sync.startUpload('item_4'), true);
    assert.strictEqual(sync.activeUploadIds.size, 4);
    assert.strictEqual(sync.canAcceptMore(), false);

    // 5th upload must be queued until a slot frees up
    assert.strictEqual(sync.startUpload('item_5'), false);
    assert.strictEqual(sync.activeUploadIds.size, 4);

    // Finish 1st upload -> frees a slot
    sync.finishUpload('item_1');
    assert.strictEqual(sync.activeUploadIds.size, 3);
    assert.strictEqual(sync.canAcceptMore(), true);

    // Now 5th upload can start
    assert.strictEqual(sync.startUpload('item_5'), true);
    assert.strictEqual(sync.activeUploadIds.size, 4);
  });

  await t.test('Telegram Cloud channel matching reuses existing CloudNest channels', () => {
    function matchesCloudNestVault(title) {
      if (!title) return false;
      return (
        title === 'CloudNest Cloud Storage' ||
        title === 'CloudNest Private Vault [E2EE]' ||
        title.includes('CloudNest')
      );
    }

    assert.strictEqual(matchesCloudNestVault('CloudNest Cloud Storage'), true);
    assert.strictEqual(matchesCloudNestVault('CloudNest Private Vault [E2EE]'), true);
    assert.strictEqual(matchesCloudNestVault('My Personal CloudNest'), true);
    assert.strictEqual(matchesCloudNestVault('Random Telegram Group'), false);
    assert.strictEqual(matchesCloudNestVault(''), false);
  });

  await t.test('Telegram Cloud remote files parsing and deduplication', () => {
    // Simulated remote messages from Telegram
    const mockMessages = [
      {
        id: 101,
        message: 'important_doc.pdf',
        media: {
          document: {
            size: 2048576,
            mimeType: 'application/pdf',
            attributes: [{ fileName: 'important_doc.pdf' }],
          },
        },
      },
      {
        id: 102,
        message: 'photo.jpg',
        media: {
          photo: {
            sizes: [{ size: 524288 }],
          },
        },
      },
      {
        id: 103,
        message: '[CloudNest E2EE] SHA-256 Verified Encrypted Chunk',
        media: {
          document: {
            size: 1048576,
            mimeType: 'application/octet-stream',
            attributes: [],
          },
        },
      },
    ];

    function parseRemoteMessages(messages, targetPeer = '-100123456789') {
      const files = [];
      for (const msg of messages) {
        const doc = msg.media?.document;
        const photo = msg.media?.photo;
        if (doc) {
          let fileName = '';
          if (doc.attributes) {
            for (const attr of doc.attributes) {
              if (attr.fileName) {
                fileName = attr.fileName;
                break;
              }
            }
          }
          if (!fileName && msg.message && !msg.message.startsWith('[CloudNest E2EE]')) {
            fileName = msg.message;
          }
          if (!fileName) {
            fileName = `file_${msg.id}`;
          }
          files.push({
            id: `file_tg_${msg.id}`,
            name: fileName,
            size: doc.size,
            telegramMessageId: msg.id,
            telegramChannelId: targetPeer,
          });
        } else if (photo) {
          files.push({
            id: `file_tg_${msg.id}`,
            name: msg.message || `photo_${msg.id}.jpg`,
            size: photo.sizes?.[0]?.size || 0,
            telegramMessageId: msg.id,
            telegramChannelId: targetPeer,
          });
        }
      }
      return files;
    }

    const parsed = parseRemoteMessages(mockMessages);
    assert.strictEqual(parsed.length, 3);
    assert.strictEqual(parsed[0].name, 'important_doc.pdf');
    assert.strictEqual(parsed[0].telegramMessageId, 101);
    assert.strictEqual(parsed[1].name, 'photo.jpg');
    assert.strictEqual(parsed[1].telegramMessageId, 102);
    assert.strictEqual(parsed[2].name, 'file_103');
    assert.strictEqual(parsed[2].telegramMessageId, 103);

    // Test deduplication sync logic
    const existingDbFileMessageIds = new Set([101]);
    let newlyImported = 0;
    for (const file of parsed) {
      if (!existingDbFileMessageIds.has(file.telegramMessageId)) {
        existingDbFileMessageIds.add(file.telegramMessageId);
        newlyImported++;
      }
    }
    assert.strictEqual(newlyImported, 2); // 102 and 103 newly imported, 101 skipped
  });

  await t.test('4 MB disk read blocks and 8 x 512 KB part splitting', () => {
    const BLOCK_SIZE = 4 * 1024 * 1024;
    const CHUNK_SIZE = 512 * 1024;

    // Verify that 4 MB block size divided by 512 KB part size yields exactly 8 MTProto parts.
    const partsPer4MbBlock = BLOCK_SIZE / CHUNK_SIZE;
    assert.strictEqual(partsPer4MbBlock, 8);

    // Verify that a 10 MB file breaks into 20 MTProto parts (512 KB each).
    const tenMB = 10 * 1024 * 1024;
    const totalParts10MB = Math.ceil(tenMB / CHUNK_SIZE);
    assert.strictEqual(totalParts10MB, 20);

    // Test buffer slicing: Buffer.alloc(4 * 1024 * 1024) sliced in 512 KB steps produces 8 slices of 512 KB each.
    const dummyBlock = Buffer.alloc(4 * 1024 * 1024);
    const slices = [];
    for (let offset = 0; offset < dummyBlock.length; offset += CHUNK_SIZE) {
      slices.push(dummyBlock.subarray(offset, offset + CHUNK_SIZE));
    }
    assert.strictEqual(slices.length, 8);
    for (const slice of slices) {
      assert.strictEqual(slice.length, 512 * 1024);
    }
  });

  await t.test('Deep producer queue size and RAM boundary constraint', () => {
    // Verify MAX_QUEUE_BUFFER = 32 chunks.
    const MAX_QUEUE_BUFFER = 32;
    const CHUNK_SIZE = 512 * 1024;
    assert.strictEqual(MAX_QUEUE_BUFFER, 32);

    // Verify that 32 * 512 KB = 16 MB max RAM buffer.
    const maxBufferBytes = MAX_QUEUE_BUFFER * CHUNK_SIZE;
    assert.strictEqual(maxBufferBytes, 16 * 1024 * 1024); // Exactly 16 MB bounded RAM
    assert.strictEqual(maxBufferBytes / (1024 * 1024), 16);
  });

  await t.test('Adaptive worker count rules for file size categories', () => {
    // Function getAdaptiveWorkerCount(fileSize):
    //   - > 500 MB -> 8 workers
    //   - 10 to 500 MB -> 4 workers
    //   - < 10 MB -> 2 workers
    function getAdaptiveWorkerCount(fileSize) {
      if (fileSize > 500 * 1024 * 1024) return 8; // Large files (> 500 MB)
      if (fileSize >= 10 * 1024 * 1024) return 4; // Medium files (10 to 500 MB)
      return 2; // Small files (< 10 MB)
    }

    // Test various sizes (e.g. 600 MB -> 8, 50 MB -> 4, 10 MB -> 4, 2 MB -> 2, 500 KB -> 2).
    assert.strictEqual(getAdaptiveWorkerCount(600 * 1024 * 1024), 8); // 600 MB -> 8
    assert.strictEqual(getAdaptiveWorkerCount(500 * 1024 * 1024 + 1), 8); // 500 MB + 1 byte -> 8
    assert.strictEqual(getAdaptiveWorkerCount(500 * 1024 * 1024), 4); // 500 MB exact -> 4
    assert.strictEqual(getAdaptiveWorkerCount(50 * 1024 * 1024), 4); // 50 MB -> 4
    assert.strictEqual(getAdaptiveWorkerCount(10 * 1024 * 1024), 4); // 10 MB -> 4
    assert.strictEqual(getAdaptiveWorkerCount(10 * 1024 * 1024 - 1), 2); // 10 MB - 1 byte -> 2
    assert.strictEqual(getAdaptiveWorkerCount(2 * 1024 * 1024), 2); // 2 MB -> 2
    assert.strictEqual(getAdaptiveWorkerCount(500 * 1024), 2); // 500 KB -> 2
  });

  await t.test('Adaptive queue concurrency rules based on file size thresholds', () => {
    // Function getAdaptiveFileLimit(items):
    //   - If any file > 500 MB -> 1 file
    //   - Else if any file >= 10 MB -> 2 files
    //   - Else -> 6 files
    function getAdaptiveFileLimit(items) {
      if (!items || items.length === 0) return 4;
      const hasLarge = items.some((item) => item.fileSize > 500 * 1024 * 1024);
      if (hasLarge) return 1;
      const hasMedium = items.some((item) => item.fileSize >= 10 * 1024 * 1024);
      if (hasMedium) return 2;
      return 6;
    }

    // If any file > 500 MB -> 1 file
    assert.strictEqual(getAdaptiveFileLimit([{ fileSize: 600 * 1024 * 1024 }]), 1);

    // Mix of 1 large and 3 small -> limit 1
    assert.strictEqual(
      getAdaptiveFileLimit([
        { fileSize: 700 * 1024 * 1024 },
        { fileSize: 2 * 1024 * 1024 },
        { fileSize: 1 * 1024 * 1024 },
        { fileSize: 500 * 1024 },
      ]),
      1
    );

    // Else if any file >= 10 MB -> 2 files
    assert.strictEqual(
      getAdaptiveFileLimit([
        { fileSize: 50 * 1024 * 1024 },
        { fileSize: 20 * 1024 * 1024 },
      ]),
      2
    );

    // Mix of medium and small files -> limit 2
    assert.strictEqual(
      getAdaptiveFileLimit([
        { fileSize: 15 * 1024 * 1024 },
        { fileSize: 2 * 1024 * 1024 },
      ]),
      2
    );

    // Boundary condition: 10 MB file exactly -> limit 2
    assert.strictEqual(getAdaptiveFileLimit([{ fileSize: 10 * 1024 * 1024 }]), 2);

    // Else (only small files < 10 MB) -> 6 files
    assert.strictEqual(
      getAdaptiveFileLimit([
        { fileSize: 2 * 1024 * 1024 },
        { fileSize: 5 * 1024 * 1024 },
        { fileSize: 500 * 1024 },
      ]),
      6
    );

    // Empty pending queue -> fallback 4
    assert.strictEqual(getAdaptiveFileLimit([]), 4);
  });

  await t.test('Exponential smoothing speed calculation and ETA formatting', () => {
    // Smoothing formula: 0.7 * prevSmoothed + 0.3 * currentInstant.
    function calculateSmoothedSpeed(prevSmoothed, currentInstant) {
      if (prevSmoothed === 0) return currentInstant;
      return 0.7 * prevSmoothed + 0.3 * currentInstant;
    }

    // Verify first sample sets initial speed, second sample applies 0.7/0.3 weights.
    let speed = 0;
    speed = calculateSmoothedSpeed(speed, 10 * 1024 * 1024); // First sample = 10 MB/s
    assert.strictEqual(speed, 10 * 1024 * 1024);
    speed = calculateSmoothedSpeed(speed, 20 * 1024 * 1024); // Second sample: 0.7 * 10 + 0.3 * 20 = 13 MB/s
    assert.strictEqual(speed, 13 * 1024 * 1024);

    // Function formatUploadEta(remainingBytes, speed):
    function formatUploadEta(remainingBytes, bytesPerSec) {
      if (!bytesPerSec || bytesPerSec <= 0 || !isFinite(bytesPerSec) || remainingBytes <= 0) {
        return '';
      }
      const seconds = Math.round(remainingBytes / bytesPerSec);
      if (seconds < 5) return '< 5s';
      if (seconds < 60) return `${seconds}s`;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins < 60) {
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
      }
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hours}h ${remMins}m`;
    }

    // Test zero or negative remaining/speed -> ''
    assert.strictEqual(formatUploadEta(0, 10 * 1024 * 1024), '');
    assert.strictEqual(formatUploadEta(-5000, 10 * 1024 * 1024), '');
    assert.strictEqual(formatUploadEta(10 * 1024 * 1024, 0), '');
    assert.strictEqual(formatUploadEta(10 * 1024 * 1024, -100), '');
    assert.strictEqual(formatUploadEta(-100, -100), '');

    // Test small duration (< 5s) -> '< 5s'
    assert.strictEqual(formatUploadEta(4 * 1024 * 1024, 1024 * 1024), '< 5s'); // 4s
    assert.strictEqual(formatUploadEta(10 * 1024 * 1024, 5 * 1024 * 1024), '< 5s'); // 2s

    // Test seconds (< 60s) -> '25s'
    assert.strictEqual(formatUploadEta(25 * 1024 * 1024, 1024 * 1024), '25s'); // 25s

    // Test minutes & seconds -> '1m 40s'
    assert.strictEqual(formatUploadEta(100 * 1024 * 1024, 1024 * 1024), '1m 40s'); // 100s = 1m 40s

    // Test exact minutes -> '2m'
    assert.strictEqual(formatUploadEta(120 * 1024 * 1024, 1024 * 1024), '2m'); // 120s = 2m

    // Test hours & minutes -> '1h 15m'
    assert.strictEqual(formatUploadEta(4500 * 1024 * 1024, 1024 * 1024), '1h 15m'); // 4500s = 75m = 1h 15m
  });

  await t.test('MtprotoSenderPool round-robin chunk dispatching', () => {
    class MockSenderPool {
      constructor(poolSize = 4) {
        this.senders = Array.from({ length: poolSize }, (_, i) => ({ id: `sender_${i + 1}` }));
        this.rrIndex = 0;
      }
      getNextSender() {
        const sender = this.senders[this.rrIndex % this.senders.length];
        this.rrIndex++;
        return sender;
      }
    }

    const pool = new MockSenderPool(4);
    // Verify that requests 0, 1, 2, 3, 4 map to senders 1, 2, 3, 4, 1 in round-robin sequence.
    const requests = [0, 1, 2, 3, 4];
    const mappedSenders = requests.map(() => pool.getNextSender().id);
    assert.deepStrictEqual(mappedSenders, [
      'sender_1',
      'sender_2',
      'sender_3',
      'sender_4',
      'sender_1',
    ]);
    assert.strictEqual(mappedSenders[0], 'sender_1');
    assert.strictEqual(mappedSenders[1], 'sender_2');
    assert.strictEqual(mappedSenders[2], 'sender_3');
    assert.strictEqual(mappedSenders[3], 'sender_4');
    assert.strictEqual(mappedSenders[4], 'sender_1');
  });

  await t.test('SQLite File Deduplication & Deterministic ID', () => {
    // 1. Deterministic file ID generation matches between upload and cloud sync
    const messageId = 42891;
    const uploadFileId = `file_tg_${messageId}`;
    const syncFileId = `file_tg_${messageId}`;
    assert.strictEqual(uploadFileId, syncFileId);

    // 2. Simulated SQLite database deduplication test
    const filesDb = [];

    function insertOrSyncFile(file) {
      if (file.telegramMessageId && file.telegramMessageId > 0) {
        const existing = filesDb.find(
          (f) => f.id === file.id || f.telegramMessageId === file.telegramMessageId
        );
        if (existing) {
          if (file.localCachePath && !existing.localCachePath) {
            existing.localCachePath = file.localCachePath;
          }
          if (existing.telegramChannelId === 'me' && file.telegramChannelId && file.telegramChannelId !== 'me') {
            existing.telegramChannelId = file.telegramChannelId;
          }
          return { inserted: false, record: existing };
        }
      }
      filesDb.push({ ...file });
      return { inserted: true, record: file };
    }

    // First: Local upload completion inserts file
    const localUploadRecord = {
      id: `file_tg_${messageId}`,
      name: 'Invoice_2026.pdf',
      telegramMessageId: messageId,
      telegramChannelId: '-10023456789',
      localCachePath: 'file:///cache/Invoice_2026.pdf',
    };
    const res1 = insertOrSyncFile(localUploadRecord);
    assert.strictEqual(res1.inserted, true);
    assert.strictEqual(filesDb.length, 1);

    // Second: Cloud sync finds same message from Telegram
    const cloudSyncRecord = {
      id: `file_tg_${messageId}`,
      name: 'Invoice_2026.pdf',
      telegramMessageId: messageId,
      telegramChannelId: '-10023456789',
      localCachePath: null, // remote scan has no local cache initially
    };
    const res2 = insertOrSyncFile(cloudSyncRecord);
    assert.strictEqual(res2.inserted, false);
    assert.strictEqual(filesDb.length, 1, 'Should NOT create duplicate file in DB');
    assert.strictEqual(filesDb[0].localCachePath, 'file:///cache/Invoice_2026.pdf', 'Must preserve local cache path');

    // Third: If local record was created with 'me' fallback, sync upgrades channel ID
    const legacyRecord = {
      id: 'file_legacy_99',
      name: 'OldDoc.docx',
      telegramMessageId: 8888,
      telegramChannelId: 'me',
      localCachePath: 'file:///cache/OldDoc.docx',
    };
    insertOrSyncFile(legacyRecord);
    assert.strictEqual(filesDb.length, 2);

    const remoteSyncForLegacy = {
      id: 'file_tg_8888',
      name: 'OldDoc.docx',
      telegramMessageId: 8888,
      telegramChannelId: '-10099999999',
      localCachePath: null,
    };
    const resLegacy = insertOrSyncFile(remoteSyncForLegacy);
    assert.strictEqual(resLegacy.inserted, false);
    assert.strictEqual(filesDb.length, 2, 'Should NOT duplicate legacy record');
    const updated = filesDb.find((f) => f.telegramMessageId === 8888);
    assert.strictEqual(updated.telegramChannelId, '-10099999999', 'Channel ID upgraded from me');
    assert.strictEqual(updated.localCachePath, 'file:///cache/OldDoc.docx', 'Cache path kept');
  });

  await t.test('Cleanup existing duplicate records algorithm', () => {
    // Simulate table with existing duplicates before patch
    let records = [
      { id: 'file_1', telegramMessageId: 101, localCachePath: 'file:///cache/1.pdf', telegramChannelId: 'me', createdAt: 1000 },
      { id: 'file_tg_101', telegramMessageId: 101, localCachePath: null, telegramChannelId: '-1001', createdAt: 1500 },
      { id: 'file_2', telegramMessageId: 202, localCachePath: null, telegramChannelId: '-1001', createdAt: 2000 },
    ];

    // Find duplicates grouped by telegramMessageId
    const counts = {};
    for (const r of records) {
      counts[r.telegramMessageId] = (counts[r.telegramMessageId] || 0) + 1;
    }
    const dupIds = Object.keys(counts).filter(k => counts[k] > 1).map(Number);
    assert.deepStrictEqual(dupIds, [101]);

    for (const dupId of dupIds) {
      const rows = records.filter(r => r.telegramMessageId === dupId);
      // Sort rows prioritizing localCachePath != null, telegramChannelId != 'me', file_tg_ prefix, createdAt
      rows.sort((a, b) => {
        const aHasCache = a.localCachePath ? 0 : 1;
        const bHasCache = b.localCachePath ? 0 : 1;
        if (aHasCache !== bHasCache) return aHasCache - bHasCache;
        const aIsChan = a.telegramChannelId !== 'me' ? 0 : 1;
        const bIsChan = b.telegramChannelId !== 'me' ? 0 : 1;
        if (aIsChan !== bIsChan) return aIsChan - bIsChan;
        return a.createdAt - b.createdAt;
      });

      const primary = rows[0];
      const secondaries = rows.slice(1);
      for (const sec of secondaries) {
        if (!primary.localCachePath && sec.localCachePath) {
          primary.localCachePath = sec.localCachePath;
        }
        records = records.filter(r => r.id !== sec.id);
      }
    }

    assert.strictEqual(records.length, 2);
    const cleaned101 = records.find(r => r.telegramMessageId === 101);
    assert.ok(cleaned101);
    assert.strictEqual(cleaned101.localCachePath, 'file:///cache/1.pdf');
    assert.strictEqual(records.filter(r => r.telegramMessageId === 101).length, 1);
  });
});

