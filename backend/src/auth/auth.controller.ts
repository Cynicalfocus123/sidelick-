import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService, SESSION_DAYS } from './auth.service.js';

export const SESSION_COOKIE = 'sl_session';

function readCookie(req: Request, name: string) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

function setSession(res: Response, token: string, keep: boolean) {
  const opts: CookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
  // keep = 30-day cookie; otherwise a browser-session cookie (gone when the browser closes)
  res.cookie(SESSION_COOKIE, token, keep ? { ...opts, maxAge: SESSION_DAYS * 24 * 3600 * 1000 } : opts);
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() body: Record<string, unknown>, @Res({ passthrough: true }) res: Response) {
    const { me, sessionToken } = await this.auth.register(body ?? {});
    setSession(res, sessionToken, true);
    return me;
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: Record<string, unknown>, @Res({ passthrough: true }) res: Response) {
    const { me, sessionToken, keep } = await this.auth.login(body ?? {});
    setSession(res, sessionToken, keep);
    return me;
  }

  @Post('login/resend-verification')
  @HttpCode(200)
  loginResend(@Body() body: Record<string, unknown>) {
    return this.auth.loginResendVerification(body ?? {});
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.auth.me(readCookie(req, SESSION_COOKIE));
  }

  @Post('resend-verification')
  @HttpCode(200)
  resend(@Req() req: Request) {
    return this.auth.resendVerification(readCookie(req, SESSION_COOKIE));
  }

  @Patch('email')
  changeEmail(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.auth.changeEmail(readCookie(req, SESSION_COOKIE), body ?? {});
  }

  @Post('creator-intro-seen')
  @HttpCode(200)
  creatorIntroSeen(@Req() req: Request) {
    return this.auth.creatorIntroSeen(readCookie(req, SESSION_COOKIE));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(readCookie(req, SESSION_COOKIE));
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }
}
