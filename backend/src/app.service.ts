import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service.js';

export interface Health {
  status: 'ok' | 'error';
  database: 'up' | 'down';
  databaseName?: string;
  time: string;
}

@Injectable()
export class AppService {
  constructor(private readonly db: DatabaseService) {}

  // Live check: API is up and PostgreSQL answers a real query.
  async getHealth(): Promise<Health> {
    const time = new Date().toISOString();
    try {
      const [row] = await this.db.query<{ name: string }>(
        'SELECT current_database() AS name',
      );
      return { status: 'ok', database: 'up', databaseName: row.name, time };
    } catch {
      return { status: 'error', database: 'down', time };
    }
  }
}
