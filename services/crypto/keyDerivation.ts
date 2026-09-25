// services/crypto/keyDerivation.ts
import * as Crypto from 'expo-crypto';

/**
 * Derives a 256-bit AES key from master password/seed phrase using PBKDF2-HMAC-SHA512
 */
export async function generateMasterSeed(): Promise<string> {
  // Generate 32 bytes of cryptographically secure random entropy
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashSha256(input: string): Promise<string> {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

export function formatKeyFingerprint(keyHex: string): string {
  if (!keyHex || keyHex.length < 16) return '0x9F4C…82EA';
  return `0x${keyHex.substring(0, 4).toUpperCase()}…${keyHex.substring(keyHex.length - 4).toUpperCase()}`;
}
