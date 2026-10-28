import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export type CreatorIntroNumbers = {
  topCreatorMonthlyUsd: number | null;
  creatorKeepPctIntro: number | null;
  creatorIntroDays: number | null;
  creatorKeepPct: number | null;
  referralPct: number | null;
};

// Public numbers for the "Become a creator" steps (F117). Set by the admin (fees B15, referral B109); null = not set yet.
@Controller('settings')
export class SettingsController {
  constructor(private readonly db: DatabaseService) {}

  @Get('creator-intro')
  async creatorIntro(): Promise<CreatorIntroNumbers> {
    const rows = await this.db.query<{ key: string; value: string | null }>('SELECT key, value FROM site_settings');
    const v = (k: string) => {
      const r = rows.find((x) => x.key === k);
      return r?.value == null ? null : Number(r.value);
    };
    return {
      topCreatorMonthlyUsd: v('top_creator_monthly_usd'),
      creatorKeepPctIntro: v('creator_keep_pct_intro'),
      creatorIntroDays: v('creator_intro_days'),
      creatorKeepPct: v('creator_keep_pct'),
      referralPct: v('referral_pct'),
    };
  }
}
