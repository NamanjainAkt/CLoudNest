// services/crypto/keyDerivation.ts
import * as Crypto from 'expo-crypto';

/**
 * Generates 256 bits (32 bytes) of cryptographically secure random entropy for AES-256 master key
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
