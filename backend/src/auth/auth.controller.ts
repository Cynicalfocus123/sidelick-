import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, SESSION_DAYS } from './auth.service.js';

export const SESSION_COOKIE = 'sl_session';

function readCookie(req: Request, name: string) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() body: Record<string, unknown>, @Res({ passthrough: true }) res: Response) {
    const { me, sessionToken } = await this.auth.register(body ?? {});
    res.cookie(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_DAYS * 24 * 3600 * 1000,
    });
    return me;
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

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(readCookie(req, SESSION_COOKIE));
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }
}
