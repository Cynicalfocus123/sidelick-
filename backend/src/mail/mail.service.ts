import { Injectable, Logger } from '@nestjs/common';
import type { Query } from '../database/database.service.js';

// Until an email service is chosen, emails are only saved in email_outbox and printed in the server log.
// Nothing leaves this PC. Swap the body of send() for the real service later.
@Injectable()
export class MailService {
  private readonly log = new Logger('Mail');

  async send(q: Query, mail: { to: string; subject: string; body: string; link?: string }) {
    await q('INSERT INTO email_outbox (to_email, subject, body, link) VALUES ($1, $2, $3, $4)', [
      mail.to,
      mail.subject,
      mail.body,
      mail.link ?? null,
    ]);
    this.log.log(`(not sent, outbox only) to ${mail.to}: ${mail.subject}${mail.link ? ` - ${mail.link}` : ''}`);
  }

  verifyEmail(to: string, link: string) {
    return {
      to,
      subject: 'Verify your email for Side Licks',
      body: `Hi! Tap the link below to verify your email and finish signing up.\n\n${link}\n\nThe link works for 24 hours. If you did not sign up, ignore this email.`,
      link,
    };
  }
}
