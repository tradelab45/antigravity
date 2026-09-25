import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readJson, readJsonWithRecovery, updateJson, writeJsonAtomic } from '../src/server/jsonStore';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rr-store-'));
const file = path.join(root, 'nested', 'store.json');

beforeEach(() => {
  fs.rmSync(path.dirname(file), { recursive: true, force: true });
});

after(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('a write creates the directory it needs', () => {
  writeJsonAtomic(file, { hello: 'world' });
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf-8')), { hello: 'world' });
});

test('a write leaves no temporary file behind', () => {
  writeJsonAtomic(file, [1, 2, 3]);
  assert.equal(fs.existsSync(`${file}.tmp`), false, 'a stray .tmp means the rename did not happen');
});

test('the copy kept is the one that was already there', () => {
  writeJsonAtomic(file, { version: 1 });
  writeJsonAtomic(file, { version: 2 });

  assert.deepEqual(readJson(file, null), { version: 2 });
  assert.deepEqual(
    JSON.parse(fs.readFileSync(`${file}.bak`, 'utf-8')),
    { version: 1 },
    'the backup must be the previous good file, not a copy of the new one',
  );
});

test('a corrupt file is recovered from its backup rather than discarded', () => {
  writeJsonAtomic(file, { portfolios: 30 });
  writeJsonAtomic(file, { portfolios: 31 });

  // What a process killed mid-write used to leave behind.
  fs.writeFileSync(file, '{"portfolios": 3');

  const result = readJsonWithRecovery(file, { portfolios: 0 });
  assert.equal(result.recoveredFrom, 'backup');
  assert.deepEqual(result.value, { portfolios: 30 }, 'the last good copy, not the defaults');
});

test('the fallback is used only when there is nothing else', () => {
  const result = readJsonWithRecovery(file, { empty: true });
  assert.equal(result.recoveredFrom, 'fallback');
  assert.deepEqual(result.value, { empty: true });
});

test('an unreadable backup does not stop the read falling back', () => {
  writeJsonAtomic(file, { a: 1 });
  fs.writeFileSync(file, 'not json');
  fs.writeFileSync(`${file}.bak`, 'not json either');

  const result = readJsonWithRecovery(file, { a: 0 });
  assert.equal(result.recoveredFrom, 'fallback');
  assert.deepEqual(result.value, { a: 0 });
});

test('an update reads, changes and writes in one step', () => {
  writeJsonAtomic(file, { count: 1 });
  const next = updateJson<{ count: number }>(file, { count: 0 }, (current) => {
    current.count += 1;
  });

  assert.equal(next.count, 2);
  assert.deepEqual(readJson(file, null), { count: 2 });
});

test('an update may return a replacement instead of changing in place', () => {
  writeJsonAtomic(file, { count: 1 });
  const next = updateJson<{ count: number }>(file, { count: 0 }, () => ({ count: 99 }));
  assert.equal(next.count, 99);
});

test('an update of a file that does not exist yet starts from the fallback', () => {
  const next = updateJson<string[]>(file, [], (current) => {
    current.push('first');
  });
  assert.deepEqual(next, ['first']);
});

test('nesting one update inside another is refused', () => {
  writeJsonAtomic(file, { count: 0 });
  assert.throws(
    () =>
      updateJson<{ count: number }>(file, { count: 0 }, () => {
        // The inner write would be overwritten by the outer one the moment it
        // returned, which is exactly the lost update this guards against.
        updateJson<{ count: number }>(file, { count: 0 }, (inner) => {
          inner.count = 5;
        });
      }),
    /already being updated/,
  );
});

test('a failed update does not leave the file locked against the next one', () => {
  assert.throws(() =>
    updateJson<{ count: number }>(file, { count: 0 }, () => {
      throw new Error('mutate blew up');
    }),
  );

  const next = updateJson<{ count: number }>(file, { count: 0 }, (current) => {
    current.count = 7;
  });
  assert.equal(next.count, 7);
});
