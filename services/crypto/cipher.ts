// services/crypto/cipher.ts
import crypto from 'crypto-browserify';
import { Buffer } from 'buffer';

export interface EncryptionResult {
  ciphertextBase64: string;
  ivHex: string;
  authTagHex: string;
  sha256Hash: string;
}

/**
 * Client-Side AES-256-GCM Zero-Knowledge Encryption
 */
export async function encryptBuffer(
  plaintextArrayBuffer: ArrayBuffer,
  keyHex: string
): Promise<EncryptionResult> {
  const safeHex = (keyHex || '').padStart(64, '0').slice(0, 64);
  const keyBuffer = Buffer.from(safeHex, 'hex');
  const iv = crypto.randomBytes(12);
  const ivHex = iv.toString('hex');

  const plaintextBuffer = Buffer.from(plaintextArrayBuffer);

  // Compute SHA-256 hash of original plaintext
  const sha256Hash = crypto.createHash('sha256').update(plaintextBuffer).digest('hex');

  // AES-256-GCM Authenticated Encryption
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  let ciphertext = cipher.update(plaintextBuffer);
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertextBase64: ciphertext.toString('base64'),
    ivHex,
    authTagHex: authTag.toString('hex'),
    sha256Hash,
  };
}

/**
 * Client-Side AES-256-GCM Zero-Knowledge Decryption
 */
export async function decryptBuffer(
  ciphertextBase64: string,
  keyHex: string,
  ivHex: string,
  authTagHex: string
): Promise<ArrayBuffer> {
  const safeHex = (keyHex || '').padStart(64, '0').slice(0, 64);
  const keyBuffer = Buffer.from(safeHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  if (authTag && authTag.length === 16) {
    decipher.setAuthTag(authTag);
  }

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.buffer.slice(decrypted.byteOffset, decrypted.byteOffset + decrypted.byteLength);
}
