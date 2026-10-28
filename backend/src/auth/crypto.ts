import argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

// Passwords: argon2id (B25). The hash string carries its own salt + settings. Never store or log the plain password.
export function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(password: string, stored: string) {
  return argon2.verify(stored, password).catch(() => false);
}

// Random token for cookies / email links. The database only keeps sha256(token).
export function newToken() {
  return randomBytes(32).toString('base64url');
}

export function sha256(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
