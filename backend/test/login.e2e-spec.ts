import '../src/env.js';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DatabaseService } from './../src/database/database.service.js';

// Log in (F11 / B25) against the real local PostgreSQL. Checks the saved sessions, not only status codes.
describe('Auth: log in (e2e)', () => {
  let app: INestApplication<App>;
  let db: DatabaseService;
  const email = `login-${Date.now()}@example.com`;
  const password = 'correct horse 2';
  let userId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    db = app.get(DatabaseService);
    const res = await request(app.getHttpServer()).post('/api/auth/register').send({ email, password, isAdult: true, acceptTerms: true }).expect(201);
    userId = res.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const sessionCount = async () => (await db.query('SELECT 1 FROM sessions WHERE user_id = $1', [userId])).length;

  it('wrong password and unknown email give the same message and no session', async () => {
    const before = await sessionCount();
    const a = await request(app.getHttpServer()).post('/api/auth/login').send({ email, password: 'wrong password' }).expect(401);
    const b = await request(app.getHttpServer()).post('/api/auth/login').send({ email: `nobody-${Date.now()}@example.com`, password }).expect(401);
    expect(a.body.message).toBe('Wrong email or password. Try again or reset your password.');
    expect(b.body.message).toBe(a.body.message);
    expect(a.headers['set-cookie']).toBeUndefined();
    expect(await sessionCount()).toBe(before);
  });

  it('right password but email not verified = 403 unverified, no session', async () => {
    const before = await sessionCount();
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email: email.toUpperCase(), password }).expect(403);
    expect(res.body).toMatchObject({ code: 'unverified', email });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(await sessionCount()).toBe(before);
  });

  it('Send it again from the log-in page needs the right password and waits a minute', async () => {
    await request(app.getHttpServer()).post('/api/auth/login/resend-verification').send({ email, password: 'wrong password' }).expect(401);
    await request(app.getHttpServer()).post('/api/auth/login/resend-verification').send({ email, password }).expect(429);
    await db.query(`UPDATE email_tokens SET created_at = now() - interval '2 minutes' WHERE user_id = $1`, [userId]);
    const res = await request(app.getHttpServer()).post('/api/auth/login/resend-verification').send({ email, password }).expect(200);
    expect(res.body.sentTo).toBe(email);
    const mails = await db.query('SELECT 1 FROM email_outbox WHERE to_email = $1', [email]);
    expect(mails).toHaveLength(2);
  });

  it('verified + Keep me logged in = 30-day cookie and 30-day session saved', async () => {
    await db.query('UPDATE users SET email_verified_at = now() WHERE id = $1', [userId]);
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email, password, keepLoggedIn: true }).expect(200);
    expect(res.body).toMatchObject({ id: userId, email, emailVerified: true });
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('sl_session='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Max-Age=2592000/);
    const [s] = await db.query<{ days: number }>(
      `SELECT extract(epoch FROM expires_at - now())::float / 86400 AS days FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    expect(s.days).toBeGreaterThan(29.9);
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie.split(';')[0]).expect(200);
  });

  it('without Keep me logged in = browser-session cookie and 1-day session', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email, password }).expect(200);
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('sl_session='))!;
    expect(cookie).not.toMatch(/Max-Age|Expires/i);
    const [s] = await db.query<{ days: number }>(
      `SELECT extract(epoch FROM expires_at - now())::float / 86400 AS days FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    expect(s.days).toBeGreaterThan(0.99);
    expect(s.days).toBeLessThan(1.01);
  });
});
