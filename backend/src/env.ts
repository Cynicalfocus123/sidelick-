import { existsSync } from 'node:fs';

// Loads backend/.env (local secrets, never in git). Real env vars win.
if (existsSync('.env')) process.loadEnvFile('.env');
