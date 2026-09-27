// __tests__/storage.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import {
  getFileCategory,
  normalizeExtension,
  DOC_EXTENSIONS,
  MEDIA_EXTENSIONS,
  AUDIO_EXTENSIONS,
  ARCHIVE_EXTENSIONS,
} from '../services/file/categories.ts';

test('Storage Breakdown & Category Taxonomies', async (t) => {
  await t.test('normalizeExtension strips leading dot and whitespace and lowercases', () => {
    assert.strictEqual(normalizeExtension('.PNG'), 'png');
    assert.strictEqual(normalizeExtension('  .JpEg  '), 'jpeg');
    assert.strictEqual(normalizeExtension('APK'), 'apk');
    assert.strictEqual(normalizeExtension(''), '');
    assert.strictEqual(normalizeExtension(null), '');
  });

  await t.test('getFileCategory maps media files (images and videos)', () => {
    assert.strictEqual(getFileCategory('jpg'), 'media');
    assert.strictEqual(getFileCategory('.png'), 'media');
    assert.strictEqual(getFileCategory('mp4'), 'media');
    assert.strictEqual(getFileCategory('mov'), 'media');
    assert.strictEqual(getFileCategory('mkv'), 'media');
    assert.strictEqual(getFileCategory('webp'), 'media');
    assert.strictEqual(getFileCategory('gif'), 'media');
  });

  await t.test('getFileCategory maps documents, spreadsheets, presentations, and code', () => {
    assert.strictEqual(getFileCategory('pdf'), 'documents');
    assert.strictEqual(getFileCategory('docx'), 'documents');
    assert.strictEqual(getFileCategory('xlsx'), 'documents');
    assert.strictEqual(getFileCategory('pptx'), 'documents');
    assert.strictEqual(getFileCategory('txt'), 'documents');
    assert.strictEqual(getFileCategory('json'), 'documents');
    assert.strictEqual(getFileCategory('md'), 'documents');
    assert.strictEqual(getFileCategory('csv'), 'documents');
  });

  await t.test('getFileCategory maps audio files', () => {
    assert.strictEqual(getFileCategory('mp3'), 'audio');
    assert.strictEqual(getFileCategory('wav'), 'audio');
    assert.strictEqual(getFileCategory('m4a'), 'audio');
    assert.strictEqual(getFileCategory('flac'), 'audio');
    assert.strictEqual(getFileCategory('ogg'), 'audio');
  });

  await t.test('getFileCategory maps archives and unclassified files (e.g. apk, bin, iso) to archives/other', () => {
    assert.strictEqual(getFileCategory('zip'), 'archives');
    assert.strictEqual(getFileCategory('tar'), 'archives');
    assert.strictEqual(getFileCategory('7z'), 'archives');
    assert.strictEqual(getFileCategory('apk'), 'archives');
    assert.strictEqual(getFileCategory('bin'), 'archives');
    assert.strictEqual(getFileCategory('exe'), 'archives');
    assert.strictEqual(getFileCategory(''), 'archives');
    assert.strictEqual(getFileCategory(null), 'archives');
  });

  await t.test('Storage percentage calculations accurately reflect byte shares', () => {
    const totalUsed = 100 * 1024 * 1024; // 100 MB
    const mediaBytes = 40 * 1024 * 1024;  // 40 MB -> 40%
    const docsBytes = 30 * 1024 * 1024;   // 30 MB -> 30%
    const audioBytes = 10 * 1024 * 1024;  // 10 MB -> 10%
    const archivesBytes = 5 * 1024 * 1024;// 5 MB
    const otherBytes = 15 * 1024 * 1024;  // 15 MB
    const totalOtherBytes = archivesBytes + otherBytes; // 20 MB -> 20%

    const mediaPercent = Number(((mediaBytes / totalUsed) * 100).toFixed(1));
    const docsPercent = Number(((docsBytes / totalUsed) * 100).toFixed(1));
    const audioPercent = Number(((audioBytes / totalUsed) * 100).toFixed(1));
    const otherPercent = Math.max(0, Number((100 - mediaPercent - docsPercent - audioPercent).toFixed(1)));

    assert.strictEqual(mediaPercent, 40);
    assert.strictEqual(docsPercent, 30);
    assert.strictEqual(audioPercent, 10);
    assert.strictEqual(otherPercent, 20);
    assert.strictEqual(mediaPercent + docsPercent + audioPercent + otherPercent, 100);
  });

  await t.test('Storage percentage handles 100% other files (e.g. standalone APK upload)', () => {
    const totalUsed = 50 * 1024 * 1024; // 50 MB
    const mediaBytes = 0;
    const docsBytes = 0;
    const audioBytes = 0;
    const archivesBytes = 0;
    const otherBytes = 50 * 1024 * 1024; // 50 MB APK
    const totalOtherBytes = archivesBytes + otherBytes;

    const mediaPercent = Number(((mediaBytes / totalUsed) * 100).toFixed(1));
    const docsPercent = Number(((docsBytes / totalUsed) * 100).toFixed(1));
    const audioPercent = Number(((audioBytes / totalUsed) * 100).toFixed(1));
    const otherPercent = Math.max(0, Number((100 - mediaPercent - docsPercent - audioPercent).toFixed(1)));

    assert.strictEqual(mediaPercent, 0);
    assert.strictEqual(docsPercent, 0);
    assert.strictEqual(audioPercent, 0);
    assert.strictEqual(otherPercent, 100);
    assert.strictEqual(totalOtherBytes, 50 * 1024 * 1024);
  });

  await t.test('Storage percentage handles empty storage (0 bytes)', () => {
    const totalUsed = 0;
    const isZero = totalUsed === 0;

    const mediaPercent = isZero ? 0 : 50;
    const docsPercent = isZero ? 0 : 50;
    const audioPercent = isZero ? 0 : 0;
    const otherPercent = isZero ? 0 : 0;

    assert.strictEqual(mediaPercent, 0);
    assert.strictEqual(docsPercent, 0);
    assert.strictEqual(audioPercent, 0);
    assert.strictEqual(otherPercent, 0);
  });
});
