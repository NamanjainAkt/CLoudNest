import type { TelegramUser } from './types';
import type { TelegramSession } from '../types/models';

export const REVIEW_PHONE_DIGITS = '919999999999';
export const REVIEW_PHONE_DISPLAY = '+91 99999 99999';
export const REVIEW_CODE = '55555';
export const REVIEW_CODE_HASH = 'REVIEW_MODE';

export function normalizePhoneDigits(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

export function isReviewPhone(phoneNumber: string): boolean {
  return normalizePhoneDigits(phoneNumber) === REVIEW_PHONE_DIGITS;
}

export function isReviewCode(code: string): boolean {
  return code.trim() === REVIEW_CODE;
}

export function getReviewUser(phoneNumber: string): TelegramUser {
  return {
    id: 999999999,
    firstName: 'Review',
    lastName: 'Reviewer',
    username: 'reviewer',
    phone: phoneNumber,
  };
}

export function getReviewSession(phoneNumber: string): TelegramSession {
  return {
    phoneNumber,
    dcId: 4,
    channelId: 'review-vault',
    channelTitle: 'CloudNest Review Vault',
    isConnected: true,
    lastPingMs: 38,
    nodeName: 'Frankfurt, DE (DC4)',
    accountName: 'Review Reviewer',
    username: 'reviewer',
  };
}
