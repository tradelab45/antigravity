import fs from 'fs';
import path from 'path';

/**
 * The JSON files this app stores its state in.
 *
 * Every store used to do its own reading and writing. Two of them wrote to a
 * temporary file and renamed it, which survives a crash mid-write; the ledger
 * wrote straight over the real file, so a process that died partway through
 * left every learner's portfolio truncated and unparseable. None of them
 * flushed to disk, so a rename could land while the bytes behind it had not,
 * and none of them kept a copy — a file that failed to parse for any reason
 * was silently replaced by the defaults, which for `ledgers.json` means every
 * portfolio in it.
 *
 * All four now go through here: rename-into-place, flushed, with the previous
 * good copy kept alongside and read back when the main file will not parse.
 */

const tempPath = (file: string) => `${file}.tmp`;
const backupPath = (file: string) => `${file}.bak`;

/** Flushes a directory entry, so a rename survives losing power. */
function syncDirectory(file: string): void {
  let handle: number | null = null;
  try {
    handle = fs.openSync(path.dirname(file), 'r');
    fs.fsyncSync(handle);
  } catch {
    // Not every platform allows opening a directory for this. The rename is
    // still atomic; only the moment it becomes durable is less certain.
  } finally {
    if (handle !== null) {
      try {
        fs.closeSync(handle);
      } catch {
        // Nothing useful to do with a failed close here.
      }
    }
  }
}

/**
 * Writes JSON so that a reader sees either the old file or the new one.
 *
 * The bytes go to a temporary file, are flushed to the disk rather than left
 * in the operating system's cache, and only then replace the real file by
 * rename — which is atomic. The file being replaced is kept as `.bak` first,
 * so a write that produces something unreadable is recoverable.
 */
export function writeJsonAtomic(file: string, value: unknown): void {
  const body = JSON.stringify(value, null, 2);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  // Keep the copy that is known to parse, not the one about to be written.
  try {
    if (fs.existsSync(file)) fs.copyFileSync(file, backupPath(file));
  } catch (err) {
    console.error(`[store] could not back up ${path.basename(file)}:`, err);
  }

  const temp = tempPath(file);
  let handle: number | null = null;
  try {
    handle = fs.openSync(temp, 'w');
    fs.writeFileSync(handle, body, 'utf-8');
    fs.fsyncSync(handle);
  } finally {
    if (handle !== null) fs.closeSync(handle);
  }

  fs.renameSync(temp, file);
  syncDirectory(file);
}

export interface ReadResult<T> {
  value: T;
  /** Set when the main file could not be read and something else was used. */
  recoveredFrom?: 'backup' | 'fallback';
}

/**
 * Reads JSON, falling back to the last good copy before the defaults.
 *
 * The order matters. A store that answers a parse failure with its defaults
 * is a store that can quietly erase everything it holds; trying `.bak` first
 * means a corrupt file costs at most the writes since the previous one.
 */
export function readJsonWithRecovery<T>(file: string, fallback: T): ReadResult<T> {
  try {
    if (fs.existsSync(file)) {
      return { value: JSON.parse(fs.readFileSync(file, 'utf-8')) as T };
    }
  } catch (err) {
    console.error(`[store] ${path.basename(file)} did not parse:`, err);
  }

  try {
    const backup = backupPath(file);
    if (fs.existsSync(backup)) {
      const value = JSON.parse(fs.readFileSync(backup, 'utf-8')) as T;
      console.warn(`[store] recovered ${path.basename(file)} from its backup.`);
      return { value, recoveredFrom: 'backup' };
    }
  } catch (err) {
    console.error(`[store] the backup of ${path.basename(file)} did not parse either:`, err);
  }

  return { value: fallback, recoveredFrom: 'fallback' };
}

export function readJson<T>(file: string, fallback: T): T {
  return readJsonWithRecovery(file, fallback).value;
}

/** Files an update is currently running against, to catch a nested one. */
const updating = new Set<string>();

/**
 * Reads, changes and writes a store as one step.
 *
 * Every one of these files is updated by reading the whole thing, changing
 * part of it and writing it back. That is only safe while nothing else runs
 * in between — and it is a single `await` between the read and the write that
 * turns it into a lost update, with the second request's copy overwriting the
 * first's. `mutate` is synchronous and a nested update of the same file
 * throws, so the pattern cannot quietly stop holding.
 */
export function updateJson<T>(file: string, fallback: T, mutate: (current: T) => T | void): T {
  if (updating.has(file)) {
    throw new Error(`[store] ${path.basename(file)} is already being updated; nest no writes inside a write.`);
  }

  updating.add(file);
  try {
    const current = readJson(file, fallback);
    const next = (mutate(current) ?? current) as T;
    writeJsonAtomic(file, next);
    return next;
  } finally {
    updating.delete(file);
  }
}
