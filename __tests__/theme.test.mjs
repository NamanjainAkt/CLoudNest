// __tests__/theme.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import { darkColors, lightColors } from '../theme/colors.ts';
import { Spacing, Radii } from '../theme/spacing.ts';

test('Theme Tokens Verification', async (t) => {
  await t.test('Dark mode base canvas must be #12131a', () => {
    assert.strictEqual(darkColors.surface, '#12131a');
    assert.strictEqual(darkColors.surfaceContainerLowest, '#0d0e15');
    assert.strictEqual(darkColors.primary, '#adc6ff');
    assert.strictEqual(darkColors.primaryContainer, '#4d8eff');
  });

  await t.test('Light mode base canvas must be #F2F2F7', () => {
    assert.strictEqual(lightColors.surface, '#F2F2F7');
    assert.strictEqual(lightColors.surfaceContainer, '#FFFFFF');
    assert.strictEqual(lightColors.primary, '#007AFF');
  });

  await t.test('Purple / Violet Ban: Ensure no forbidden purple hex codes exist', () => {
    const forbiddenPurples = ['#8A2BE2', '#9370DB', '#7B68EE', '#6A5ACD', '#483D8B', '#800080', '#4B0082'];
    for (const [key, val] of Object.entries(darkColors)) {
      if (typeof val === 'string' && val.startsWith('#')) {
        assert.ok(!forbiddenPurples.includes(val.toUpperCase()), `Forbidden purple found in darkColors.${key}`);
      }
    }
    for (const [key, val] of Object.entries(lightColors)) {
      if (typeof val === 'string' && val.startsWith('#')) {
        assert.ok(!forbiddenPurples.includes(val.toUpperCase()), `Forbidden purple found in lightColors.${key}`);
      }
    }
  });

  await t.test('Radii and Spacing validation', () => {
    assert.strictEqual(Radii.full, 9999);
    assert.strictEqual(Radii.default, 16);
    assert.strictEqual(Spacing.gutter, 16);
  });
});
