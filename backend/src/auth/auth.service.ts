import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService, type Query } from '../database/database.service.js';
import { MailService } from '../mail/mail.service.js';
import { hashPassword, newToken, sha256, verifyPassword } from './crypto.js';

export const SESSION_DAYS = 30;
// Log in without "Keep me logged in": the cookie ends when the browser closes, the server session after 1 day.
export const SHORT_SESSION_DAYS = 1;
const VERIFY_HOURS = 24;
const RESEND_WAIT_SECONDS = 60;
const RESEND_MAX_PER_HOUR = 5;
// Bump when the Terms / Privacy text changes (lawyer text = B16). Saved on every sign-up.
export const TERMS_VERSION = 'draft-2026-10-26';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Me = { id: string; email: string; emailVerified: boolean };
type FieldErrors = Partial<Record<'email' | 'password' | 'terms', string>>;

function fail(fields: FieldErrors): never {
  throw new BadRequestException({ message: 'Please fix the highlighted fields', fields });
}

// Used when the email has no account, so a wrong email takes as long as a wrong password (nobody can test which emails exist).
let dummyHash: Promise<string> | undefined;
const WRONG_LOGIN = 'Wrong email or password. Try again or reset your password.';

function normEmail(v: unknown) {
  return typeof v === 'string' ? v.trim().toLowerCase() : '';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly mail: MailService,
  ) {}

  /** Sign up (F10 / B25): saves the account, signs the person in on this device, sends the verify link. */
  async register(body: Record<string, unknown>): Promise<{ me: Me; sessionToken: string }> {
    const email = normEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const fields: FieldErrors = {};
    if (!EMAIL_RE.test(email) || email.length > 254) fields.email = 'Enter a valid email address';
    if (password.length < 8) fields.password = 'Password is too short (at least 8 characters)';
    else if (password.length > 200) fields.password = 'Password is too long';
    if (body.isAdult !== true || body.acceptTerms !== true) fields.terms = 'Please tick both boxes to continue';
    if (Object.keys(fields).length) fail(fields);

    const passwordHash = await hashPassword(password);
    try {
      return await this.db.transaction(async (q) => {
        const [user] = await q<{ id: string }>(
          'INSERT INTO users (email, password_hash, is_adult, terms_accepted_at, terms_version) VALUES ($1, $2, true, now(), $3) RETURNING id',
          [email, passwordHash, TERMS_VERSION],
        );
        await this.sendVerifyLink(q, user.id, email);
        const sessionToken = await this.createSession(q, user.id);
        return { me: { id: user.id, email, emailVerified: false }, sessionToken };
      });
    } catch (e) {
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException({ message: 'An account with this email already exists', fields: { email: 'This email already has an account. Sign in instead.' } });
      }
      throw e;
    }
  }

  /**
   * Log in (F11 / B25). Wrong email or password = one message for both. Correct password but email not verified yet =
   * 403 "unverified" and NO session (approved wireframe: verify first).
   */
  async login(body: Record<string, unknown>): Promise<{ me: Me; sessionToken: string; keep: boolean }> {
    const { user, keep } = await this.checkPassword(body);
    if (!user.email_verified_at) {
      throw new ForbiddenException({ message: 'Please verify your email first', code: 'unverified', email: user.email });
    }
    const sessionToken = await this.db.transaction((q) => this.createSession(q, user.id, keep ? SESSION_DAYS : SHORT_SESSION_DAYS));
    return { me: { id: user.id, email: user.email, emailVerified: true }, sessionToken, keep };
  }

  /** "Send it again" on the log-in page (not signed in yet): needs the right email + password, same limits as the popup. */
  async loginResendVerification(body: Record<string, unknown>) {
    const { user } = await this.checkPassword(body);
    if (user.email_verified_at) throw new BadRequestException({ message: 'Your email is already verified' });
    await this.resendTo(user.id, user.email);
    return { sentTo: user.email };
  }

  async me(sessionToken: string | undefined): Promise<Me> {
    if (!sessionToken) throw new UnauthorizedException('Not signed in');
    const [row] = await this.db.query<{ id: string; email: string; email_verified_at: Date | null }>(
      `SELECT u.id, u.email, u.email_verified_at FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [sha256(sessionToken)],
    );
    if (!row) throw new UnauthorizedException('Not signed in');
    return { id: row.id, email: row.email, emailVerified: !!row.email_verified_at };
  }

  /** "Send again" in the Check your email popup. Max once a minute and 5 an hour (B34). */
  async resendVerification(sessionToken: string | undefined) {
    const me = await this.me(sessionToken);
    if (me.emailVerified) throw new BadRequestException({ message: 'Your email is already verified' });
    await this.resendTo(me.id, me.email);
    return { sentTo: me.email };
  }

  private async resendTo(userId: string, email: string) {
    await this.db.transaction(async (q) => {
      const [last] = await q<{ age: number | null; hour: number }>(
        `SELECT extract(epoch FROM now() - max(created_at))::float AS age,
                count(*) FILTER (WHERE created_at > now() - interval '1 hour')::int AS hour
         FROM email_tokens WHERE user_id = $1 AND purpose = 'verify'`,
        [userId],
      );
      if (last && last.hour >= RESEND_MAX_PER_HOUR) {
        throw new HttpException({ message: 'Too many emails sent. Please try again in an hour' }, HttpStatus.TOO_MANY_REQUESTS);
      }
      if (last?.age !== null && last?.age !== undefined && last.age < RESEND_WAIT_SECONDS) {
        throw new HttpException({ message: `Please wait ${Math.ceil(RESEND_WAIT_SECONDS - last.age)} seconds before sending again` }, HttpStatus.TOO_MANY_REQUESTS);
      }
      await this.sendVerifyLink(q, userId, email);
    });
  }

  /** "Change email" in the popup: only before the email is verified. Old links stop working. */
  async changeEmail(sessionToken: string | undefined, body: Record<string, unknown>): Promise<Me> {
    const me = await this.me(sessionToken);
    if (me.emailVerified) throw new BadRequestException({ message: 'Your email is already verified' });
    const email = normEmail(body.email);
    if (!EMAIL_RE.test(email) || email.length > 254) fail({ email: 'Enter a valid email address' });
    try {
      await this.db.transaction(async (q) => {
        await q('UPDATE users SET email = $1 WHERE id = $2', [email, me.id]);
        await q(`UPDATE email_tokens SET used_at = now() WHERE user_id = $1 AND purpose = 'verify' AND used_at IS NULL`, [me.id]);
        await this.sendVerifyLink(q, me.id, email);
      });
    } catch (e) {
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException({ message: 'An account with this email already exists', fields: { email: 'This email already has an account.' } });
      }
      throw e;
    }
    return { ...me, email };
  }

  async logout(sessionToken: string | undefined) {
    if (sessionToken) await this.db.query('DELETE FROM sessions WHERE token_hash = $1', [sha256(sessionToken)]);
  }

  private async checkPassword(body: Record<string, unknown>) {
    const email = normEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) throw new UnauthorizedException({ message: WRONG_LOGIN });
    const [user] = await this.db.query<{ id: string; email: string; password_hash: string; email_verified_at: Date | null }>(
      'SELECT id, email, password_hash, email_verified_at FROM users WHERE email = $1',
      [email],
    );
    dummyHash ??= hashPassword(newToken());
    const ok = await verifyPassword(password.slice(0, 200), user?.password_hash ?? (await dummyHash));
    if (!user || !ok) throw new UnauthorizedException({ message: WRONG_LOGIN });
    return { user, keep: body.keepLoggedIn === true };
  }

  private async createSession(q: Query, userId: string, days = SESSION_DAYS) {
    const token = newToken();
    await q(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`, [sha256(token), userId, days]);
    return token;
  }

  private async sendVerifyLink(q: Query, userId: string, email: string) {
    const token = newToken();
    await q(
      `INSERT INTO email_tokens (token_hash, user_id, purpose, email, expires_at) VALUES ($1, $2, 'verify', $3, now() + interval '${VERIFY_HOURS} hours')`,
      [sha256(token), userId, email],
    );
    const link = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/verify-email?token=${token}`;
    await this.mail.send(q, this.mail.verifyEmail(email, link));
  }
}
