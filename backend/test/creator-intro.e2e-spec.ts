import '../src/env.js';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DatabaseService } from './../src/database/database.service.js';

// "Become a creator" steps after sign-up (F117) against the real local PostgreSQL.
describe('Creator intro (e2e)', () => {
  let app: INestApplication<App>;
  let db: DatabaseService;
  const email = `intro-${Date.now()}@example.com`;
  let cookie = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    db = app.get(DatabaseService);
    const res = await request(app.getHttpServer()).post('/api/auth/register').send({ email, password: 'correct horse 3', isAdult: true, acceptTerms: true }).expect(201);
    expect(res.body.creatorIntroSeen).toBe(false);
    cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('sl_session='))!.split(';')[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it('numbers come from site_settings (null until the admin sets them)', async () => {
    const res = await request(app.getHttpServer()).get('/api/settings/creator-intro').expect(200);
    expect(Object.keys(res.body).sort()).toEqual(['creatorIntroDays', 'creatorKeepPct', 'creatorKeepPctIntro', 'referralPct', 'topCreatorMonthlyUsd']);
    const rows = await db.query<{ value: string | null }>(`SELECT value FROM site_settings WHERE key = 'referral_pct'`);
    expect(res.body.referralPct).toBe(rows[0].value == null ? null : Number(rows[0].value));
  });

  it('marking the steps as seen needs a session and is saved once', async () => {
    await request(app.getHttpServer()).post('/api/auth/creator-intro-seen').expect(401);
    const res = await request(app.getHttpServer()).post('/api/auth/creator-intro-seen').set('Cookie', cookie).expect(200);
    expect(res.body).toMatchObject({ email, creatorIntroSeen: true });
    const [u1] = await db.query<{ creator_intro_seen_at: Date }>('SELECT creator_intro_seen_at FROM users WHERE email = $1', [email]);
    expect(u1.creator_intro_seen_at).toBeInstanceOf(Date);

    await request(app.getHttpServer()).post('/api/auth/creator-intro-seen').set('Cookie', cookie).expect(200);
    const [u2] = await db.query<{ creator_intro_seen_at: Date }>('SELECT creator_intro_seen_at FROM users WHERE email = $1', [email]);
    expect(u2.creator_intro_seen_at.getTime()).toBe(u1.creator_intro_seen_at.getTime()); // first time kept

    const me = await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.creatorIntroSeen).toBe(true);
  });
});
