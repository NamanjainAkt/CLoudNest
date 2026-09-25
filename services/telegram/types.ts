// services/telegram/types.ts

export interface TelegramDC {
  id: number;
  ip: string;
  port: number;
  location: string;
  webEndpoint: string;
}

export const TELEGRAM_DATA_CENTERS: Record<number, TelegramDC> = {
  1: { id: 1, ip: '149.154.175.50', port: 443, location: 'Miami, USA (DC1)', webEndpoint: 'https://pluto.web.telegram.org/apiws' },
  2: { id: 2, ip: '149.154.167.51', port: 443, location: 'Amsterdam, NL (DC2)', webEndpoint: 'https://venus.web.telegram.org/apiws' },
  4: { id: 4, ip: '149.154.167.91', port: 443, location: 'Frankfurt, DE (DC4)', webEndpoint: 'https://vesta.web.telegram.org/apiws' }, // Default European Enclave
  5: { id: 5, ip: '91.108.56.165', port: 443, location: 'Singapore (DC5)', webEndpoint: 'https://flora.web.telegram.org/apiws' },
};

export interface AuthSendCodeResponse {
  phoneCodeHash: string;
  isRegistered: boolean;
  timeoutSeconds: number;
}

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  phone: string;
}

export interface MTProtoUploadResult {
  messageId: number;
  channelId: string;
  bytesUploaded: number;
  partsCount: number;
}
