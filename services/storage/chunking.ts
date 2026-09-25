// services/storage/chunking.ts
import { encryptBuffer, decryptBuffer } from '../crypto/cipher';

// Safe resolution across Node.js unit tests and React Native runtime
let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system');
} catch {}

export const CHUNK_SIZE_BYTES = 1024 * 1024; // 1 MB per chunk part

export interface FileChunkMetadata {
  partIndex: number;
  totalParts: number;
  sizeBytes: number;
  ivHex: string;
  authTagHex: string;
  sha256Hash: string;
  telegramMessageId?: number;
}

export class ChunkingService {
  /**
   * Calculate number of chunks for a given file size
   */
  static getChunkCount(fileSizeBytes: number, chunkSize: number = CHUNK_SIZE_BYTES): number {
    if (fileSizeBytes <= 0) return 1;
    return Math.ceil(fileSizeBytes / chunkSize);
  }

  /**
   * Read and encrypt file in sequential binary chunks
   */
  static async processFileForUpload(
    fileUri: string,
    fileSizeBytes: number,
    masterKeyHex: string,
    onProgress?: (progress: number, partIndex: number, totalParts: number) => void
  ): Promise<FileChunkMetadata[]> {
    const totalParts = this.getChunkCount(fileSizeBytes);
    const chunks: FileChunkMetadata[] = [];

    // Read full file as base64
    const base64Content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const binaryString = atob(base64Content);
    const totalLength = binaryString.length;
    const partLength = Math.ceil(totalLength / totalParts);

    for (let partIndex = 1; partIndex <= totalParts; partIndex++) {
      const start = (partIndex - 1) * partLength;
      const end = Math.min(start + partLength, totalLength);
      const partSlice = binaryString.slice(start, end);

      // Convert slice to ArrayBuffer
      const buf = new Uint8Array(partSlice.length);
      for (let i = 0; i < partSlice.length; i++) {
        buf[i] = partSlice.charCodeAt(i);
      }

      // Encrypt chunk
      const encrypted = await encryptBuffer(buf.buffer, masterKeyHex);

      chunks.push({
        partIndex,
        totalParts,
        sizeBytes: buf.length,
        ivHex: encrypted.ivHex,
        authTagHex: encrypted.authTagHex,
        sha256Hash: encrypted.sha256Hash,
      });

      if (onProgress) {
        onProgress(partIndex / totalParts, partIndex, totalParts);
      }
    }

    return chunks;
  }

  /**
   * Reassemble decrypted chunks into destination path
   */
  static async assembleFile(
    decryptedChunks: ArrayBuffer[],
    destinationUri: string
  ): Promise<string> {
    let totalLength = 0;
    for (const chunk of decryptedChunks) {
      totalLength += chunk.byteLength;
    }

    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of decryptedChunks) {
      merged.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    let binary = '';
    for (let i = 0; i < merged.length; i++) {
      binary += String.fromCharCode(merged[i]);
    }
    const base64 = btoa(binary);

    await FileSystem.writeAsStringAsync(destinationUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return destinationUri;
  }
}
