import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UI_STRINGS, translate, type UiStringKey } from '../src/i18n/strings';

const keys = Object.keys(UI_STRINGS) as UiStringKey[];

test('every key has English, which is the source of truth', () => {
  for (const key of keys) {
    const entry = UI_STRINGS[key];
    assert.ok(entry.en && entry.en.trim().length > 0, `"${key}" has no English string`);
  }
});

test('Hindi is served when it is set', () => {
  assert.equal(translate('nav.home', 'HINDI'), UI_STRINGS['nav.home'].hi);
  assert.equal(translate('nav.home', 'ENGLISH'), UI_STRINGS['nav.home'].en);
});

test('a row with no Hindi falls back to English rather than going blank', () => {
  // Every row is translated today, so the fallback is asserted on the rule
  // itself: `hi` is only preferred when it is a non-empty string.
  for (const key of keys) {
    const entry = UI_STRINGS[key];
    const expected = entry.hi ? entry.hi : entry.en;
    assert.equal(translate(key, 'HINDI'), expected);
    assert.ok(translate(key, 'HINDI').length > 0, `"${key}" renders an empty label in Hindi`);
  }
});

test('an unknown key shows itself rather than an empty label', () => {
  assert.equal(translate('nope.not.a.key' as UiStringKey, 'ENGLISH'), 'nope.not.a.key');
});

test('no Hindi entry is left as a copy of the English one', () => {
  // A pasted-but-untranslated row is worse than an absent one: it looks done.
  // Compared as plain strings, because the literal types of the two columns
  // do not overlap and TypeScript would reject the comparison outright.
  const untranslated = keys.filter((key) => {
    const entry: { en: string; hi: string } = UI_STRINGS[key];
    if (!entry.hi) return false;
    return entry.hi === entry.en && !/^[A-Z&]+$/.test(entry.en);
  });
  assert.deepEqual(untranslated, [], `these rows are not actually translated: ${untranslated.join(', ')}`);
});

test('the Hindi shell keeps the financial terms Indian speakers use in English', () => {
  // Deliberate: "portfolio" and "market" read as stiffer transliterated into
  // pure Hindi, and the Academy copy already mixes this way.
  assert.match(UI_STRINGS['nav.portfolio'].hi, /पोर्टफोलियो/);
  assert.match(UI_STRINGS['nav.traderDna'].hi, /DNA/);
  assert.match(UI_STRINGS['header.totalPnl'].hi, /P&L/);
});

test('every Hindi string carries Devanagari or a deliberate acronym', () => {
  for (const key of keys) {
    const entry = UI_STRINGS[key];
    if (!entry.hi) continue;
    const hasDevanagari = /[ऀ-ॿ]/.test(entry.hi);
    assert.ok(hasDevanagari, `"${key}" is marked Hindi but has no Devanagari: ${entry.hi}`);
  }
});
