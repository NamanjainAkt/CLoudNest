// __tests__/cacheManager.test.mjs
import test from 'node:test';
import assert from 'node:assert';

const DEFAULT_MAX_CACHE_BYTES = 1024 * 1024 * 1024; // 1 GB

function formatBytes(bytes) {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function calculateUsagePercentage(usedBytes, limitBytes = DEFAULT_MAX_CACHE_BYTES) {
  if (limitBytes <= 0) return 0;
  return Math.min(100, Math.round((usedBytes / limitBytes) * 100));
}

function sortLruEvictionCandidates(files) {
  const nonFavorites = files.filter((f) => !f.isFavorite).sort((a, b) => a.updatedAt - b.updatedAt);
  const favorites = files.filter((f) => f.isFavorite).sort((a, b) => a.updatedAt - b.updatedAt);
  return [...nonFavorites, ...favorites];
}

test('Offline Cache Manager & LRU Eviction Engine', async (t) => {
  await t.test('Format bytes accurately across size ranges', () => {
    assert.strictEqual(formatBytes(0), '0 B');
    assert.strictEqual(formatBytes(512), '512 B');
    assert.strictEqual(formatBytes(1024), '1 KB');
    assert.strictEqual(formatBytes(1536), '1.5 KB');
    assert.strictEqual(formatBytes(1048576), '1 MB');
    assert.strictEqual(formatBytes(10485760), '10 MB');
    assert.strictEqual(formatBytes(1073741824), '1 GB');
    assert.strictEqual(formatBytes(2684354560), '2.5 GB');
  });

  await t.test('Default maximum cache limit must be 1 GB', () => {
    assert.strictEqual(DEFAULT_MAX_CACHE_BYTES, 1024 * 1024 * 1024);
  });

  await t.test('Usage percentage calculation respects bounds', () => {
    assert.strictEqual(calculateUsagePercentage(0), 0);
    assert.strictEqual(calculateUsagePercentage(536870912), 50); // 512 MB of 1GB
    assert.strictEqual(calculateUsagePercentage(1073741824), 100); // 1 GB of 1GB
    assert.strictEqual(calculateUsagePercentage(2147483648), 100); // Caps at 100%
  });

  await t.test('LRU eviction candidate sorting prioritizes non-favorite files first', () => {
    const mockFiles = [
      { id: 'f1', isFavorite: true, size: 100, updatedAt: 1000 },
      { id: 'f2', isFavorite: false, size: 200, updatedAt: 2000 },
      { id: 'f3', isFavorite: false, size: 300, updatedAt: 1500 },
      { id: 'f4', isFavorite: true, size: 400, updatedAt: 4000 },
    ];

    const sorted = sortLruEvictionCandidates(mockFiles);

    // Non-favorites with oldest updatedAt first
    assert.strictEqual(sorted[0].id, 'f3'); // updatedAt: 1500, non-favorite
    assert.strictEqual(sorted[1].id, 'f2'); // updatedAt: 2000, non-favorite
    assert.strictEqual(sorted[2].id, 'f1'); // updatedAt: 1000, favorite
    assert.strictEqual(sorted[3].id, 'f4'); // updatedAt: 4000, favorite
  });
});
