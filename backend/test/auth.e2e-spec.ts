import '../src/env.js';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DatabaseService } from './../src/database/database.service.js';
import { verifyPassword } from './../src/auth/crypto.js';

// Real local PostgreSQL. Checks what is really saved, not only status codes.
// Test accounts use @example.com with a unique time stamp (they stay in the local DB).
describe('Auth: register (e2e)', () => {
  let app: INestApplication<App>;
  let db: DatabaseService;
  const email = `reg-${Date.now()}@example.com`;
  const password = 'correct horse 1';
  let cookie = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    db = app.get(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects bad input with field messages and saves nothing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short', isAdult: true, acceptTerms: false })
      .expect(400);
    expect(res.body.fields).toEqual({
      email: 'Enter a valid email address',
      password: 'Password is too short (at least 8 characters)',
      terms: 'Please tick both boxes to continue',
    });
    const rows = await db.query("SELECT 1 FROM users WHERE email = 'not-an-email'");
    expect(rows).toHaveLength(0);
  });

  it('creates the account, saves it correctly, signs in and queues the verify email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: `  ${email.toUpperCase()} `, password, isAdult: true, acceptTerms: true })
      .expect(201);
    expect(res.body).toMatchObject({ email, emailVerified: false });

    const set = res.headers['set-cookie'] as unknown as string[];
    cookie = set.find((c) => c.startsWith('sl_session='))!.split(';')[0];
    expect(set.join()).toMatch(/HttpOnly/i);

    const [user] = await db.query<{ id: string; email: string; password_hash: string; is_adult: boolean; terms_accepted_at: Date; terms_version: string; email_verified_at: Date | null }>(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    expect(user.email).toBe(email); // trimmed + lower case
    expect(user.password_hash).not.toContain(password);
    expect(user.password_hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(password, user.password_hash)).toBe(true);
    expect(user.is_adult).toBe(true);
    expect(user.terms_accepted_at).toBeInstanceOf(Date);
    expect(user.terms_version).toBe('draft-2026-10-26');
    expect(user.email_verified_at).toBeNull();

    const sessions = await db.query('SELECT 1 FROM sessions WHERE user_id = $1', [user.id]);
    expect(sessions).toHaveLength(1);
    const tokens = await db.query<{ purpose: string }>('SELECT purpose FROM email_tokens WHERE user_id = $1', [user.id]);
    expect(tokens.map((t) => t.purpose)).toEqual(['verify']);
    const mails = await db.query<{ subject: string; link: string }>('SELECT subject, link FROM email_outbox WHERE to_email = $1', [email]);
    expect(mails).toHaveLength(1);
    expect(mails[0].subject).toBe('Verify your email for Side Licks');
    expect(mails[0].link).toMatch(/^http:\/\/localhost:3000\/verify-email\?token=[\w-]{40,}$/);
  });

  it('GET /me knows who is signed in', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    const res = await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(res.body).toMatchObject({ email, emailVerified: false });
  });

  it('same email again (any case) = 409, no second account', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: email.toUpperCase(), password, isAdult: true, acceptTerms: true })
      .expect(409);
    expect(res.body.fields.email).toMatch(/already has an account/);
    const rows = await db.query('SELECT 1 FROM users WHERE lower(email) = $1', [email]);
    expect(rows).toHaveLength(1);
  });

  it('Send again waits a minute between emails', async () => {
    await request(app.getHttpServer()).post('/api/auth/resend-verification').set('Cookie', cookie).expect(429);
    await db.query(`UPDATE email_tokens SET created_at = now() - interval '2 minutes' WHERE email = $1`, [email]);
    await request(app.getHttpServer()).post('/api/auth/resend-verification').set('Cookie', cookie).expect(200);
    const mails = await db.query('SELECT 1 FROM email_outbox WHERE to_email = $1', [email]);
    expect(mails).toHaveLength(2);

    // max 5 an hour: pretend 5 were sent in the last hour, more than a minute ago
    const [u] = await db.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
    for (let i = 0; i < 3; i++) {
      await db.query(`INSERT INTO email_tokens (token_hash, user_id, purpose, email, created_at, expires_at) VALUES ($1, $2, 'verify', $3, now() - interval '10 minutes', now())`, [`fake-${Date.now()}-${i}`, u.id, email]);
    }
    await db.query(`UPDATE email_tokens SET created_at = now() - interval '10 minutes' WHERE email = $1`, [email]);
    const res = await request(app.getHttpServer()).post('/api/auth/resend-verification').set('Cookie', cookie).expect(429);
    expect(res.body.message).toMatch(/in an hour/);
  });

  it('Change email updates the account, cancels old links and sends a new one', async () => {
    const newEmail = `chg-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer()).patch('/api/auth/email').set('Cookie', cookie).send({ email: newEmail }).expect(200);
    expect(res.body.email).toBe(newEmail);
    const [user] = await db.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [newEmail]);
    expect(user).toBeDefined();
    const open = await db.query<{ email: string }>(`SELECT email FROM email_tokens WHERE user_id = $1 AND used_at IS NULL`, [user.id]);
    expect(open.map((t) => t.email)).toEqual([newEmail]);
    const mails = await db.query('SELECT 1 FROM email_outbox WHERE to_email = $1', [newEmail]);
    expect(mails).toHaveLength(1);
  });

  it('log out ends the session', async () => {
    await request(app.getHttpServer()).post('/api/auth/logout').set('Cookie', cookie).expect(204);
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie).expect(401);
  });
});
