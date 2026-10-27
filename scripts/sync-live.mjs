// Copies every file committed in git (HEAD) into live/, byte for byte.
// Never deletes: files in live/ that are no longer in git are listed so the owner can decide.
// Usage: node scripts/sync-live.mjs          -> copy + report
//        node scripts/sync-live.mjs --check  -> only report differences (exit 1 if any)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const live = join(root, 'live');
const checkOnly = process.argv.includes('--check');

const git = (args) => execFileSync('git', args, { cwd: root, maxBuffer: 1 << 30 });
if (git(['status', '--porcelain']).toString().trim()) {
  console.warn('Warning: uncommitted changes exist. live/ only gets committed files - commit first.');
}
const tracked = git(['ls-tree', '-r', '--name-only', '-z', 'HEAD']).toString().split('\0').filter(Boolean);
const hash = (buf) => createHash('sha1').update(buf).digest('hex');

const differ = [];
for (const path of tracked) {
  const data = git(['show', `HEAD:${path}`]);
  const dest = join(live, path);
  if (existsSync(dest) && hash(readFileSync(dest)) === hash(data)) continue;
  differ.push(path);
  if (!checkOnly) {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, data);
  }
}

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : [relative(live, join(dir, e.name)).split(sep).join('/')],
      )
    : [];
const inGit = new Set(tracked);
const extra = walk(live).filter((p) => !inGit.has(p));

if (checkOnly) {
  console.log(differ.length ? `Different/missing in live/: ${differ.join(', ')}` : `live/ matches git HEAD (${tracked.length} files).`);
} else {
  console.log(`Copied ${differ.length} file(s) to live/. ${tracked.length} files in git.`);
}
if (extra.length) console.log(`In live/ but not in git (NOT deleted - ask owner): ${extra.join(', ')}`);
if (checkOnly && (differ.length || extra.length)) process.exit(1);
