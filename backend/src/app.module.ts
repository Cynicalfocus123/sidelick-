import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { SettingsController } from './settings/settings.controller.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AppController, SettingsController],
  providers: [AppService],
})
export class AppModule {}
