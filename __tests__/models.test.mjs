// __tests__/models.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import { TELEGRAM_DATA_CENTERS } from '../services/telegram/types.ts';

test('Telegram Data Centers Configuration', async (t) => {
  await t.test('Frankfurt DC4 is configured properly', () => {
    const dc4 = TELEGRAM_DATA_CENTERS[4];
    assert.ok(dc4);
    assert.strictEqual(dc4.id, 4);
    assert.strictEqual(dc4.ip, '149.154.167.91');
    assert.strictEqual(dc4.port, 443);
    assert.ok(dc4.location.includes('Frankfurt'));
  });

  await t.test('All primary DCs exist (1, 2, 4, 5)', () => {
    assert.ok(TELEGRAM_DATA_CENTERS[1]);
    assert.ok(TELEGRAM_DATA_CENTERS[2]);
    assert.ok(TELEGRAM_DATA_CENTERS[4]);
    assert.ok(TELEGRAM_DATA_CENTERS[5]);
  });
});
