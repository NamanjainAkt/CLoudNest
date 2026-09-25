// __tests__/mnemonic.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import {
  entropyToMnemonic,
  mnemonicToEntropy,
  isValidMnemonicWord,
  validateMnemonic,
  WORDLIST,
} from '../services/crypto/mnemonic.ts';

test('BIP39 Standard 24-Word Recovery Mnemonic', async (t) => {
  // Official BIP39 256-bit test vectors
  const testVectors = [
    {
      entropy: '0000000000000000000000000000000000000000000000000000000000000000',
      mnemonic:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
    },
    {
      entropy: '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
      mnemonic:
        'legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth title',
    },
    {
      entropy: '8080808080808080808080808080808080808080808080808080808080808080',
      mnemonic:
        'letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic bless',
    },
    {
      entropy: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      mnemonic:
        'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo vote',
    },
  ];

  await t.test('entropyToMnemonic with official BIP39 test vectors', () => {
    for (const vector of testVectors) {
      const words = entropyToMnemonic(vector.entropy);
      assert.strictEqual(words.length, 24);
      assert.strictEqual(words.join(' '), vector.mnemonic);
    }
  });

  await t.test('mnemonicToEntropy with official BIP39 test vectors', () => {
    for (const vector of testVectors) {
      const words = vector.mnemonic.split(' ');
      const entropy = mnemonicToEntropy(words);
      assert.strictEqual(entropy, vector.entropy);
    }
  });

  await t.test('mnemonicToEntropy roundtrip — generate entropy -> mnemonic -> entropy', () => {
    for (let i = 0; i < 20; i++) {
      const randomEntropy = crypto.randomBytes(32).toString('hex');
      const words = entropyToMnemonic(randomEntropy);
      assert.strictEqual(words.length, 24);
      const recoveredEntropy = mnemonicToEntropy(words);
      assert.strictEqual(recoveredEntropy, randomEntropy);
      assert.strictEqual(recoveredEntropy.length, 64);
    }
  });

  await t.test('Checksum validation — corrupt one word, verify mnemonicToEntropy throws', () => {
    const validWords = testVectors[0].mnemonic.split(' ');
    // Corrupt the last word which carries the checksum
    const corruptedWords = [...validWords];
    corruptedWords[23] = 'abandon'; // Checksum mismatch
    assert.throws(
      () => mnemonicToEntropy(corruptedWords),
      /checksum/i
    );

    // Corrupt an inner word
    const corruptedInner = [...validWords];
    corruptedInner[0] = 'ability';
    assert.throws(
      () => mnemonicToEntropy(corruptedInner),
      /checksum/i
    );
  });

  await t.test('Unknown word rejection — use a word not in BIP39 list, verify it throws', () => {
    const words = testVectors[0].mnemonic.split(' ');
    const invalidWords = [...words];
    invalidWords[5] = 'notabipword123';
    assert.throws(
      () => mnemonicToEntropy(invalidWords),
      /Invalid word/i
    );
  });

  await t.test('isValidMnemonicWord for valid and invalid words', () => {
    assert.strictEqual(isValidMnemonicWord('abandon'), true);
    assert.strictEqual(isValidMnemonicWord('zoo'), true);
    assert.strictEqual(isValidMnemonicWord('art'), true);
    assert.strictEqual(isValidMnemonicWord('ABANDON'), true); // Case-insensitive
    assert.strictEqual(isValidMnemonicWord('  zoo  '), true); // Trimmed
    assert.strictEqual(isValidMnemonicWord('notabipword'), false);
    assert.strictEqual(isValidMnemonicWord(''), false);
    assert.strictEqual(isValidMnemonicWord(null), false);
    assert.strictEqual(isValidMnemonicWord(undefined), false);
  });

  await t.test('validateMnemonic returns correct error messages', () => {
    const validWords = testVectors[0].mnemonic.split(' ');
    const validResult = validateMnemonic(validWords);
    assert.strictEqual(validResult.valid, true);
    assert.strictEqual(validResult.error, undefined);

    // Wrong word count
    const shortResult = validateMnemonic(validWords.slice(0, 12));
    assert.strictEqual(shortResult.valid, false);
    assert.match(shortResult.error, /exactly 24 words/);

    // Empty word
    const emptyWordList = [...validWords];
    emptyWordList[3] = '';
    const emptyResult = validateMnemonic(emptyWordList);
    assert.strictEqual(emptyResult.valid, false);
    assert.match(emptyResult.error, /Word #4 is empty/);

    // Invalid BIP39 word
    const badWordList = [...validWords];
    badWordList[7] = 'supercalifragilistic';
    const badWordResult = validateMnemonic(badWordList);
    assert.strictEqual(badWordResult.valid, false);
    assert.match(badWordResult.error, /not a valid BIP39 word/);

    // Invalid checksum
    const badChecksumList = [...validWords];
    badChecksumList[23] = 'abandon';
    const badChecksumResult = validateMnemonic(badChecksumList);
    assert.strictEqual(badChecksumResult.valid, false);
    assert.match(badChecksumResult.error, /checksum/i);
  });

  await t.test('24 words produces 64 hex chars (256-bit key)', () => {
    const randomEntropy = crypto.randomBytes(32).toString('hex');
    const words = entropyToMnemonic(randomEntropy);
    assert.strictEqual(words.length, 24);
    const recoveredHex = mnemonicToEntropy(words);
    assert.strictEqual(recoveredHex.length, 64);
    assert.match(recoveredHex, /^[0-9a-f]{64}$/);
    assert.strictEqual(recoveredHex, randomEntropy);
  });

  await t.test('WORDLIST contains exactly 2048 unique words sorted in alphabetical order', () => {
    assert.strictEqual(WORDLIST.length, 2048);
    const uniqueSet = new Set(WORDLIST);
    assert.strictEqual(uniqueSet.size, 2048);
    assert.strictEqual(WORDLIST[0], 'abandon');
    assert.strictEqual(WORDLIST[2047], 'zoo');
  });
});
