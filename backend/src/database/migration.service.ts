import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { MIGRATIONS } from './migrations.js';

const LOCK_ID = 7_420_261; // any fixed number: only one app instance migrates at a time

// Applies new entries from migrations.ts on startup, all in one transaction behind an advisory lock
// (two servers / test files starting together must not run the same change twice).
@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly log = new Logger('Migrations');

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.db.transaction(async (q) => {
      await q('SELECT pg_advisory_xact_lock($1)', [LOCK_ID]);
      await q('CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
      const done = new Set((await q<{ id: string }>('SELECT id FROM schema_migrations')).map((r) => r.id));
      for (const m of MIGRATIONS) {
        if (done.has(m.id)) continue;
        await q(m.sql);
        await q('INSERT INTO schema_migrations (id) VALUES ($1)', [m.id]);
        this.log.log(`applied ${m.id}`);
      }
    });
  }
}
