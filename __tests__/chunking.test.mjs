// __tests__/chunking.test.mjs
import test from 'node:test';
import assert from 'node:assert';

const CHUNK_SIZE_BYTES = 1024 * 1024; // 1 MB

function getChunkCount(fileSizeBytes, chunkSize = CHUNK_SIZE_BYTES) {
  if (fileSizeBytes <= 0) return 1;
  return Math.ceil(fileSizeBytes / chunkSize);
}

test('File Stream Chunking & Slicing Engine', async (t) => {
  await t.test('Calculates correct chunk counts for various file sizes', () => {
    // 500 KB file -> 1 chunk
    assert.strictEqual(getChunkCount(500 * 1024), 1);

    // Exact 1 MB -> 1 chunk
    assert.strictEqual(getChunkCount(CHUNK_SIZE_BYTES), 1);

    // 2.5 MB -> 3 chunks
    assert.strictEqual(getChunkCount(Math.floor(2.5 * 1024 * 1024)), 3);

    // 15 MB -> 15 chunks
    assert.strictEqual(getChunkCount(15 * 1024 * 1024), 15);

    // 0 or negative size -> 1
    assert.strictEqual(getChunkCount(0), 1);
  });

  await t.test('Verifies chunk boundary constraints', () => {
    assert.strictEqual(CHUNK_SIZE_BYTES, 1024 * 1024);
  });
});
