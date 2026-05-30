/**
 * linkStore.js — In-memory pending Discord verification code store.
 * Codes are 8-char alphanumeric, expire in 10 minutes, and are single-use.
 */

'use strict';

// discordUserId -> { code, expiresAt }
const pending = new Map();

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a new verification code for a Discord user.
 * Overwrites any existing pending code.
 */
function generateCode(discordUserId) {
  const code = Array.from({ length: 8 }, () =>
    CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join('');
  const expiresAt = Date.now() + CODE_TTL_MS;
  pending.set(discordUserId, { code, expiresAt });
  return { code, expiresAt };
}

/**
 * Check if a code is valid for a given Discord user.
 * Returns { valid: boolean, reason?: string }
 */
function validateCode(discordUserId, code) {
  const entry = pending.get(discordUserId);
  if (!entry) return { valid: false, reason: 'No pending code found.' };
  if (Date.now() > entry.expiresAt) {
    pending.delete(discordUserId);
    return { valid: false, reason: 'Code has expired.' };
  }
  if (entry.code.toUpperCase() !== code.toUpperCase()) {
    return { valid: false, reason: 'Incorrect code.' };
  }
  return { valid: true };
}

/**
 * Remove a pending code (after use or cancellation).
 */
function clearCode(discordUserId) {
  pending.delete(discordUserId);
}

/**
 * Check if a Discord user has a pending code.
 */
function hasPendingCode(discordUserId) {
  const entry = pending.get(discordUserId);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    pending.delete(discordUserId);
    return false;
  }
  return true;
}

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of pending.entries()) {
    if (now > entry.expiresAt) pending.delete(id);
  }
}, 5 * 60 * 1000);

module.exports = { generateCode, validateCode, clearCode, hasPendingCode };
