// Start / stop / status of the local PostgreSQL 18 (portable install on D:).
// Usage: node scripts/db.mjs start|stop|status
import { execFileSync } from 'node:child_process';

const PG_BIN = process.env.PG_BIN ?? 'D:/dev/tools/pgsql18/bin';
const PG_DATA = process.env.PG_DATA ?? 'D:/dev/data/pgsql18';
const cmd = process.argv[2] ?? 'status';
const args = {
  start: ['start', '-D', PG_DATA, '-l', `${PG_DATA}/server.log`, '-w'],
  stop: ['stop', '-D', PG_DATA, '-m', 'fast', '-w'],
  status: ['status', '-D', PG_DATA],
}[cmd];
if (!args) {
  console.error('Usage: node scripts/db.mjs start|stop|status');
  process.exit(1);
}
try {
  execFileSync(`${PG_BIN}/pg_ctl.exe`, args, { stdio: 'inherit' });
} catch (e) {
  process.exit(e.status ?? 1);
}
