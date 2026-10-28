import { Module } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, MailService],
})
export class AuthModule {}
