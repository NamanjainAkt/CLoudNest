// __tests__/mnemonic.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import {
  seedHexToMnemonic,
  mnemonicToSeedHex,
  isValidMnemonicWord,
} from '../services/crypto/mnemonic.ts';

test('12-Word Mnemonic Vault Recovery Phrase', async (t) => {
  const sampleSeed = '4d8eff291a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d';

  await t.test('Generate 12 words from master seed hex', () => {
    const words = seedHexToMnemonic(sampleSeed);
    assert.strictEqual(words.length, 12);
    for (const w of words) {
      assert.strictEqual(typeof w, 'string');
      assert.ok(w.length > 0);
      assert.strictEqual(isValidMnemonicWord(w), true);
    }
  });

  await t.test('Deterministic roundtrip: seed -> mnemonic -> seed', () => {
    const words = seedHexToMnemonic(sampleSeed);
    const recoveredHex = mnemonicToSeedHex(words);
    assert.strictEqual(recoveredHex.length, 64);
    // Re-encoding recovered seed produces identical 12 words
    const reWords = seedHexToMnemonic(recoveredHex);
    assert.deepStrictEqual(reWords, words);
  });

  await t.test('Rejects invalid word count in mnemonicToSeedHex', () => {
    assert.throws(() => {
      mnemonicToSeedHex(['abandon', 'ability']);
    }, /must contain exactly 12 words/);
  });
});
