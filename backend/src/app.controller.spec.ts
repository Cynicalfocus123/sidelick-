import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseService } from './database/database.service.js';

describe('AppController', () => {
  const build = async (query: () => Promise<unknown>) => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: DatabaseService, useValue: { query } }],
    }).compile();
    return app.get(AppController);
  };

  it('reports database up', async () => {
    const c = await build(async () => [{ name: 'sidelick' }]);
    expect(await c.getHealth()).toMatchObject({
      status: 'ok',
      database: 'up',
      databaseName: 'sidelick',
    });
  });

  it('reports database down', async () => {
    const c = await build(async () => {
      throw new Error('no db');
    });
    expect(await c.getHealth()).toMatchObject({
      status: 'error',
      database: 'down',
    });
  });
});
