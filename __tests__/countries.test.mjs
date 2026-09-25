// __tests__/countries.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  findCountryByCode,
  findCountryByDialCode,
  formatPhoneNumber,
  extractCountryAndNumber,
} from '../services/telegram/countries.ts';

test('Country & Dial Code Configuration for India & International', async (t) => {
  await t.test('Default country must be India (+91)', () => {
    assert.ok(DEFAULT_COUNTRY);
    assert.strictEqual(DEFAULT_COUNTRY.code, 'IN');
    assert.strictEqual(DEFAULT_COUNTRY.dialCode, '+91');
    assert.strictEqual(DEFAULT_COUNTRY.flag, '🇮🇳');
    assert.strictEqual(DEFAULT_COUNTRY.maxLength, 10);
  });

  await t.test('Find country by ISO code and dial code', () => {
    const india = findCountryByCode('IN');
    assert.ok(india);
    assert.strictEqual(india.name, 'India');
    assert.strictEqual(india.dialCode, '+91');

    const byDial = findCountryByDialCode('+91');
    assert.ok(byDial);
    assert.strictEqual(byDial.code, 'IN');

    const us = findCountryByDialCode('+1');
    assert.ok(us);
    assert.strictEqual(us.code, 'US');
  });

  await t.test('Format Indian phone number with 5-5 split', () => {
    const india = DEFAULT_COUNTRY;
    assert.strictEqual(formatPhoneNumber('98765', india), '98765');
    assert.strictEqual(formatPhoneNumber('9876543210', india), '98765 43210');
    // Truncates to 10 digits
    assert.strictEqual(formatPhoneNumber('9876543210999', india), '98765 43210');
  });

  await t.test('Format US phone number with 3-3-4 split', () => {
    const us = findCountryByCode('US');
    assert.ok(us);
    assert.strictEqual(formatPhoneNumber('5550192834', us), '555 019 2834');
  });

  await t.test('Extract country and local number from international string', () => {
    // Pasted +91 9876543210
    const resIndia = extractCountryAndNumber('+91 9876543210');
    assert.ok(resIndia.country);
    assert.strictEqual(resIndia.country.code, 'IN');
    assert.strictEqual(resIndia.localDigits, '9876543210');

    // Pasted +15550192834
    const resUs = extractCountryAndNumber('+15550192834');
    assert.ok(resUs.country);
    assert.strictEqual(resUs.country.code, 'US');
    assert.strictEqual(resUs.localDigits, '5550192834');

    // Local without +
    const resLocal = extractCountryAndNumber('9876543210');
    assert.strictEqual(resLocal.country, undefined);
    assert.strictEqual(resLocal.localDigits, '9876543210');
  });
});
