import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

export type Query = <T extends QueryResultRow>(sql: string, params?: unknown[]) => Promise<T[]>;

// One shared PostgreSQL pool for the whole app. Settings come from .env.
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'sidelick',
    max: 10,
  });

  async query<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
    const result = await this.pool.query<T>(sql, params);
    return result.rows;
  }

  // Runs fn inside BEGIN / COMMIT on one connection; ROLLBACK if it throws.
  async transaction<R>(fn: (q: Query) => Promise<R>): Promise<R> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const q: Query = async (sql, params = []) => (await client.query(sql, params)).rows;
      const out = await fn(q);
      await client.query('COMMIT');
      return out;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
