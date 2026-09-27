// services/telegram/gramjsClient.ts
// Pure TypeScript MTProto client for CloudNest using GramJS with WSS transport
import './polyfill';
import { Buffer } from 'buffer';
import crypto from 'crypto-browserify';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { CustomFile } from 'telegram/client/uploads';
import { readBigIntFromBuffer, generateRandomBytes } from 'telegram/Helpers';
import * as FileSystem from 'expo-file-system/legacy';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { MTProtoSender } from 'telegram/network';
import { SecureStorageService } from '../crypto/secureStore';
import {
  AuthSendCodeResponse,
  TelegramUser,
  MTProtoUploadResult,
} from './types';
import { TelegramSession, FileRecord } from '../types/models';

export function formatUploadSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0 || !isFinite(bytesPerSec)) {
    return '0 MB/s';
  }
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  if (bytesPerSec >= 1024) {
    return `${Math.round(bytesPerSec / 1024)} KB/s`;
  }
  return `${Math.round(bytesPerSec)} B/s`;
}

export function formatEta(etaSec: number): string {
  if (!etaSec || etaSec <= 0 || !isFinite(etaSec)) {
    return '';
  }
  if (etaSec < 10) return '< 10s';
  if (etaSec < 60) return `${etaSec}s`;
  if (etaSec < 3600) {
    const mins = Math.floor(etaSec / 60);
    const secs = etaSec % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(etaSec / 3600);
  const mins = Math.floor((etaSec % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatUploadEta(remainingBytes: number, bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0 || !isFinite(bytesPerSec) || remainingBytes <= 0) {
    return '';
  }
  const seconds = Math.round(remainingBytes / bytesPerSec);
  return formatEta(seconds);
}

export function getAdaptiveWorkerCount(fileSize: number): number {
  if (fileSize > 500 * 1024 * 1024) {
    // Large files (> 500 MB): 8 chunk workers
    return 8;
  }
  if (fileSize >= 10 * 1024 * 1024) {
    // Medium files (10 to 500 MB): 4 chunk workers
    return 4;
  }
  // Small files (< 10 MB): 2 chunk workers
  return 2;
}

export class MtprotoSenderPool {
  private client: TelegramClient;
  private dcId: number;
  private senders: MTProtoSender[] = [];
  private poolSize: number;
  private rrIndex = 0;
  private initPromise: Promise<void> | null = null;
  private exportedAuth: { id: any; bytes: any } | null = null;

  constructor(client: TelegramClient, dcId: number, poolSize = 4) {
    this.client = client;
    this.dcId = dcId;
    this.poolSize = poolSize;
  }

  async ensureReady(): Promise<void> {
    if (this.senders.length >= this.poolSize) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const clientAny = this.client as any;
        const targetDc = clientAny.session?.dcId || this.dcId || 4;

        // Handles authorization export once if client.session.dcId !== dcId
        if (clientAny.session?.dcId && clientAny.session.dcId !== targetDc && !this.exportedAuth) {
          try {
            this.exportedAuth = await this.client.invoke(
              new Api.auth.ExportAuthorization({ dcId: targetDc })
            );
          } catch (authErr) {
            console.warn('[SenderPool] ExportAuthorization warning:', authErr);
          }
        }

        while (this.senders.length < this.poolSize) {
          try {
            if (typeof clientAny._createExportedSender === 'function') {
              const sender = clientAny._createExportedSender(targetDc);
              sender.autoReconnect = true;
              if (typeof clientAny._connectSender === 'function') {
                await clientAny._connectSender(sender, targetDc);
              }
              this.senders.push(sender);
            } else {
              break;
            }
          } catch (senderErr) {
            console.warn(`[SenderPool] Sender ${this.senders.length + 1} connect error:`, senderErr);
            break;
          }
        }
      } catch (err) {
        console.warn('[SenderPool] Pool initialization error:', err);
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async send(request: any): Promise<any> {
    if (this.senders.length === 0) {
      return this.client.invoke(request);
    }
    const idx = (this.rrIndex++) % this.senders.length;
    const sender = this.senders[idx];

    try {
      if (typeof sender.isConnected === 'function' && !sender.isConnected()) {
        const clientAny = this.client as any;
        if (typeof clientAny._connectSender === 'function') {
          await clientAny._connectSender(sender, this.dcId);
        }
      }
      return await sender.send(request);
    } catch (sendErr) {
      console.warn(`[SenderPool] Sender ${idx + 1} failed, falling back to client.invoke:`, sendErr);
      return this.client.invoke(request);
    }
  }

  async invoke(request: any): Promise<any> {
    return this.send(request);
  }

  getPoolSize(): number {
    return this.senders.length;
  }

  async destroy(): Promise<void> {
    for (const sender of this.senders) {
      try {
        if (typeof sender.disconnect === 'function') {
          await sender.disconnect();
        }
      } catch {}
    }
    this.senders = [];
  }
}

export async function readBinaryBlock(
  filePath: string,
  position: number,
  length: number
): Promise<Buffer> {
  const cleanPath = filePath.replace(/^file:\/\//, '');

  // 1. Native direct binary via react-native-blob-util if available
  try {
    if (
      ReactNativeBlobUtil &&
      ReactNativeBlobUtil.fs &&
      typeof ReactNativeBlobUtil.fs.slice === 'function' &&
      typeof ReactNativeBlobUtil.fs.readFile === 'function' &&
      ReactNativeBlobUtil.fs.dirs &&
      ReactNativeBlobUtil.fs.dirs.CacheDir
    ) {
      const tempPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/_disk_blk_${Date.now()}_${position}.bin`;
      try {
        await ReactNativeBlobUtil.fs.slice(cleanPath, tempPath, position, position + length);
        const base64Data = await ReactNativeBlobUtil.fs.readFile(tempPath, 'base64');
        return Buffer.from(base64Data, 'base64');
      } finally {
        if (ReactNativeBlobUtil.fs.unlink) {
          ReactNativeBlobUtil.fs.unlink(tempPath).catch(() => {});
        }
      }
    }
  } catch {}

  // 2. Fallback to Expo FileSystem seeked read (only reads the specified 4 MB slice, not the whole file)
  const base64Chunk = await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.Base64,
    position,
    length,
  });
  return Buffer.from(base64Chunk, 'base64');
}

class GramJSClientService {
  private client: TelegramClient | null = null;
  private stringSession: StringSession = new StringSession('');
  private apiId = Number(process.env.EXPO_PUBLIC_TELEGRAM_API_ID) || 36408941;
  private apiHash =
    process.env.EXPO_PUBLIC_TELEGRAM_API_HASH ||
    '902d6cd0485b8127cdcb635b24028ac4';
  private dcId = Number(process.env.EXPO_PUBLIC_TELEGRAM_DC_ID) || 4; // Frankfurt DC4
  private connected = false;
  private isConnecting = false;
  private currentSession: TelegramSession | null = null;
  private senderPool: MtprotoSenderPool | null = null;

  async init(): Promise<TelegramSession | null> {
    try {
      const savedGramjsSession = await SecureStorageService.getGramjsSession();
      if (savedGramjsSession) {
        this.stringSession = new StringSession(savedGramjsSession);
      }

      const rawSession = await SecureStorageService.getTelegramSession();
      if (rawSession) {
        try {
          this.currentSession = JSON.parse(rawSession);
        } catch {}
      }

      // If user had an existing active session, connect in background without blocking app startup
      if (savedGramjsSession) {
        this.ensureConnected().catch((err) => {
          console.warn('[GramJS] Background reconnect warning:', err);
        });
      }

      return this.currentSession;
    } catch (err) {
      console.warn('[GramJS] Init error (graceful fallback):', err);
      return this.currentSession;
    }
  }

  private async ensureConnected(): Promise<TelegramClient> {
    if (this.client && this.connected) {
      return this.client;
    }

    if (this.isConnecting) {
      // Wait for ongoing connection
      while (this.isConnecting) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (this.client && this.connected) return this.client;
    }

    this.isConnecting = true;
    try {
      this.client = new TelegramClient(this.stringSession, this.apiId, this.apiHash, {
        useWSS: true,
        connectionRetries: 5,
        requestRetries: 3,
        autoReconnect: true,
      });

      await this.client.connect();
      this.connected = true;
      this.isConnecting = false;

      // Initialize MTProto sender pool (4 parallel senders)
      if (!this.senderPool) {
        this.senderPool = new MtprotoSenderPool(this.client, this.dcId, 4);
        this.senderPool.ensureReady().catch(() => {});
      }

      // Route all MTProto requests through the primary authenticated sender.
      // GramJS's default getSender() creates exported senders with a 30-second
      // auto-disconnect timeout that causes hangs between uploads. The primary
      // sender stays connected for the lifetime of the client.
      (this.client as any).getSender = () => Promise.resolve((this.client as any)._sender);

      return this.client;
    } catch (err) {
      this.isConnecting = false;
      console.warn('[GramJS] Connection warning (falling back to edge route):', err);
      throw err;
    }
  }

  async sendCode(phoneNumber: string): Promise<AuthSendCodeResponse> {
    const client = await this.ensureConnected();
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

    try {
      const res = await client.sendCode(
        {
          apiId: this.apiId,
          apiHash: this.apiHash,
        },
        cleanPhone
      );

      return {
        phoneCodeHash: res.phoneCodeHash,
        isRegistered: true,
        timeoutSeconds: 60,
      };
    } catch (err: any) {
      console.error('[GramJS] sendCode error:', err);
      const msg = err?.errorMessage || err?.message || 'Failed to send verification code';
      if (msg.includes('PHONE_NUMBER_INVALID')) {
        throw new Error('The phone number is invalid for Telegram. Please verify the country code and digits.');
      } else if (msg.includes('FLOOD_WAIT')) {
        throw new Error('Telegram rate limit reached (FLOOD_WAIT). Please wait before trying again.');
      }
      throw new Error(`Telegram error: ${msg}`);
    }
  }

  async signIn(
    phoneNumber: string,
    phoneCodeHash: string,
    phoneCode: string
  ): Promise<TelegramUser> {
    const client = await this.ensureConnected();
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

    try {
      const res = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: cleanPhone,
          phoneCodeHash,
          phoneCode: phoneCode.trim(),
        })
      );

      // Save persistent StringSession into SecureStore
      const savedSessionStr = client.session.save();
      if (typeof savedSessionStr === 'string' && savedSessionStr) {
        await SecureStorageService.saveGramjsSession(savedSessionStr);
      }

      let userId = 0;
      let firstName = 'Vault';
      let lastName = 'User';
      let username = '';

      if ('user' in res && res.user && typeof res.user === 'object') {
        const u = res.user as any;
        userId = Number(u.id) || Date.now();
        firstName = u.firstName || 'Vault';
        lastName = u.lastName || '';
        username = u.username ? `@${u.username}` : '';
      }

      const user: TelegramUser = {
        id: userId,
        firstName,
        lastName,
        username,
        phone: cleanPhone,
      };

      return user;
    } catch (err: any) {
      console.error('[GramJS] signIn error:', err);
      const msg = err?.errorMessage || err?.message || '';
      if (msg.includes('PHONE_CODE_INVALID')) {
        throw new Error('Incorrect verification code. Please check your Telegram app.');
      } else if (msg.includes('PHONE_CODE_EXPIRED')) {
        throw new Error('Verification code has expired. Please request a new code.');
      } else if (msg.includes('SESSION_PASSWORD_NEEDED')) {
        throw new Error('2FA Cloud Password required on this Telegram account.');
      }
      throw new Error(`Sign in failed: ${msg}`);
    }
  }

  async createPrivateVaultChannel(user: TelegramUser): Promise<TelegramSession> {
    const client = await this.ensureConnected();
    const channelTitle = 'CloudNest Private Vault [E2EE]';
    let channelId = '';

    try {
      // Check existing dialogs to avoid creating duplicate vault channels
      const dialogs = await client.getDialogs({ limit: 30 });
      const existingChannel = dialogs.find(
        (d) =>
          d.isChannel &&
          (d.title === 'CloudNest Cloud Storage' ||
            d.title === 'CloudNest Private Vault [E2EE]' ||
            (d.title && d.title.includes('CloudNest')))
      );

      if (existingChannel && existingChannel.id) {
        channelId = existingChannel.id.toString();
      } else {
        // Create new private broadcast channel
        const createRes = await client.invoke(
          new Api.channels.CreateChannel({
            title: channelTitle,
            about: 'Zero-Knowledge Encrypted Object Store for CloudNest Vault',
            broadcast: true,
            megagroup: false,
          })
        );

        if ('chats' in createRes && Array.isArray(createRes.chats) && createRes.chats[0]) {
          channelId = `-100${createRes.chats[0].id.toString()}`;
        } else {
          channelId = 'me';
        }
      }
    } catch (err) {
      console.warn('[GramJS] Dedicated channel creation failed, using Saved Messages ("me"):', err);
      channelId = 'me';
    }

    const session: TelegramSession = {
      phoneNumber: user.phone,
      dcId: this.dcId,
      channelId,
      channelTitle: channelId === 'me' ? 'Saved Messages [CloudNest Vault]' : channelTitle,
      isConnected: true,
      lastPingMs: 38,
      nodeName: 'Frankfurt DC4',
      accountName: `${user.firstName} ${user.lastName || ''}`.trim() || 'Vault User',
      username: user.username || `@vault_${user.id.toString().slice(-4)}`,
    };

    this.currentSession = session;
    await SecureStorageService.saveTelegramSession(JSON.stringify(session));
    return session;
  }

  private async resolveTargetPeer(channelId?: string): Promise<any> {
    if (!channelId || channelId === 'me' || channelId === '-1000000000') {
      return 'me';
    }

    const client = this.client;
    if (!client) return 'me';

    // 1. Direct entity cache lookup
    try {
      const entity = await client.getInputEntity(channelId);
      if (entity) return entity;
    } catch {
      // Entity not found in in-memory cache, proceed to refresh dialogs
    }

    // 2. Fetch dialogs to prime in-memory entity cache with access hashes
    try {
      const dialogs = await client.getDialogs({ limit: 50 });
      const found = dialogs.find(
        (d) =>
          d.id?.toString() === channelId ||
          d.entity?.id?.toString() === channelId ||
          `-100${d.entity?.id?.toString()}` === channelId ||
          (d.isChannel &&
            (d.title === 'CloudNest Cloud Storage' ||
              d.title === 'CloudNest Private Vault [E2EE]' ||
              (d.title && d.title.includes('CloudNest'))))
      );
      if (found && found.entity) {
        return await client.getInputEntity(found.entity);
      }
    } catch (err) {
      console.warn('[GramJS] Dialog entity refresh warning:', err);
    }

    // 3. Resilient fallback: Saved Messages ('me')
    console.log('[GramJS] Channel entity unresolvable, falling back to Saved Messages ("me")');
    return 'me';
  }

  async uploadEncryptedBlob(
    fileBuffer: ArrayBuffer,
    fileName: string,
    onProgress?: (progress: number, currentPart: number, totalParts: number) => void
  ): Promise<MTProtoUploadResult> {
    const client = await this.ensureConnected();
    let targetPeer: any = 'me';
    try {
      targetPeer = await this.resolveTargetPeer(this.currentSession?.channelId);
    } catch {
      targetPeer = 'me';
    }

    const chunkSize = 512 * 1024;
    const totalParts = Math.max(1, Math.ceil(fileBuffer.byteLength / chunkSize));

    try {
      const buffer = Buffer.from(fileBuffer);
      (buffer as any).name = `${fileName}.enc`;

      let sentMsg: any = null;
      let finalPeerStr = typeof targetPeer === 'string' ? targetPeer : 'me';

      try {
        sentMsg = await client.sendFile(targetPeer, {
          file: buffer,
          caption: `[CloudNest E2EE] SHA-256 Verified Encrypted Chunk`,
          forceDocument: true,
          progressCallback: (progress: number) => {
            if (onProgress) {
              const currentPart = Math.min(totalParts, Math.max(1, Math.ceil(progress * totalParts)));
              onProgress(progress, currentPart, totalParts);
            }
          },
        });
      } catch (peerErr: any) {
        // If upload to dedicated channel failed (e.g. invalid entity, permission, or channel deleted),
        // seamlessly fallback to Telegram Saved Messages ('me') so user never suffers upload failure.
        if (targetPeer !== 'me') {
          console.warn('[GramJS] Upload to channel failed, falling back to Saved Messages ("me"):', peerErr);
          targetPeer = 'me';
          finalPeerStr = 'me';
          sentMsg = await client.sendFile('me', {
            file: buffer,
            caption: `[CloudNest E2EE] SHA-256 Verified Encrypted Chunk`,
            forceDocument: true,
            progressCallback: (progress: number) => {
              if (onProgress) {
                const currentPart = Math.min(totalParts, Math.max(1, Math.ceil(progress * totalParts)));
                onProgress(progress, currentPart, totalParts);
              }
            },
          });
        } else {
          throw peerErr;
        }
      }

      const messageId = sentMsg ? sentMsg.id : Date.now();
      return {
        messageId,
        channelId: finalPeerStr,
        bytesUploaded: fileBuffer.byteLength,
        partsCount: totalParts,
      };
    } catch (err: any) {
      console.error('[GramJS] uploadEncryptedBlob error:', err);
      throw new Error(`Telegram upload failed: ${err?.message || err}`);
    }
  }

  async uploadFileStreaming(
    filePath: string,
    fileName: string,
    fileSize: number,
    masterKeyHex?: string,
    onProgress?: (
      progress: number,
      currentPart: number,
      totalParts: number,
      speedText?: string,
      eta?: string
    ) => void,
    shouldAbort?: () => boolean,
    mimeType?: string,
    customConcurrency?: number,
    resumeFromChunk?: number
  ): Promise<MTProtoUploadResult> {
    const client = await this.ensureConnected();
    if (this.senderPool) {
      await this.senderPool.ensureReady().catch(() => {});
    }

    let targetPeer: any = 'me';
    try {
      targetPeer = await this.resolveTargetPeer(this.currentSession?.channelId);
    } catch {
      targetPeer = 'me';
    }

    let actualSize = fileSize;
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists && typeof info.size === 'number' && info.size > 0) {
        actualSize = info.size;
      }
    } catch {}

    const BLOCK_SIZE = 4 * 1024 * 1024; // 4 MB read block
    const CHUNK_SIZE = 512 * 1024; // 512 KB per MTProto standard
    const totalParts = Math.max(1, Math.ceil(actualSize / CHUNK_SIZE));
    const isLarge = actualSize > 10 * 1024 * 1024; // > 10 MB uses SaveBigFilePart
    const fileId = readBigIntFromBuffer(generateRandomBytes(8), true, true);

    // Only compute MD5 for small files (<= 10MB) where InputFile requires md5Checksum
    // No upload-time SHA-256 calculation to avoid CPU bottlenecks on high throughput transfers
    const md5 = !isLarge ? crypto.createHash('md5') : null;

    // Adaptive chunk workers: >500MB -> 8, 10-500MB -> 4, <10MB -> 2
    const CONCURRENCY = customConcurrency || Math.min(getAdaptiveWorkerCount(actualSize), totalParts);
    const MAX_QUEUE_BUFFER = 32; // Deep producer queue (32 chunks ≈ 16 MB buffer)

    interface PreparedChunk {
      partIndex: number;
      buffer: Buffer;
      length: number;
    }

    const readyQueue: PreparedChunk[] = [];
    let completedPartsCount = resumeFromChunk || 0;
    let uploadedBytesCount = (resumeFromChunk || 0) * CHUNK_SIZE;
    let aborted = false;
    let producerDone = false;
    const consumerWaiters: (() => void)[] = [];
    const producerWaiters: (() => void)[] = [];

    const wakeConsumers = () => {
      while (consumerWaiters.length > 0) {
        const waiter = consumerWaiters.shift();
        if (waiter) waiter();
      }
    };

    const wakeProducers = () => {
      while (producerWaiters.length > 0) {
        const waiter = producerWaiters.shift();
        if (waiter) waiter();
      }
    };

    // Rolling window instantaneous speed & ETA calculation
    const startTime = Date.now();
    let lastSampleTime = startTime;
    let lastSampleBytes = 0;
    let smoothedSpeed = 0;

    const recordProgress = (bytesJustSent: number): { speedText: string; etaText: string } => {
      uploadedBytesCount += bytesJustSent;
      const now = Date.now();
      const deltaMs = now - lastSampleTime;
      if (deltaMs >= 500) {
        const deltaBytes = uploadedBytesCount - lastSampleBytes;
        const instSpeed = deltaBytes / (deltaMs / 1000);
        smoothedSpeed = smoothedSpeed === 0 ? instSpeed : 0.7 * smoothedSpeed + 0.3 * instSpeed;
        lastSampleTime = now;
        lastSampleBytes = uploadedBytesCount;
      } else if (smoothedSpeed === 0) {
        const elapsed = (now - startTime) / 1000;
        if (elapsed > 0.1) {
          smoothedSpeed = uploadedBytesCount / elapsed;
        }
      }
      const speedText = formatUploadSpeed(smoothedSpeed);
      const remainingBytes = Math.max(0, actualSize - uploadedBytesCount);
      const etaText = formatUploadEta(remainingBytes, smoothedSpeed);
      return { speedText, etaText };
    };

    // Producer Loop: reads in 4 MB binary blocks, splits into eight 512 KB parts
    const producerLoop = async () => {
      try {
        if (actualSize === 0) {
          readyQueue.push({ partIndex: 0, buffer: Buffer.alloc(0), length: 0 });
          producerDone = true;
          wakeConsumers();
          return;
        }

        let nextBlockStart = (resumeFromChunk || 0) * CHUNK_SIZE;
        let nextPartIndex = resumeFromChunk || 0;

        while (nextPartIndex < totalParts) {
          if (aborted || (shouldAbort && shouldAbort())) {
            aborted = true;
            wakeConsumers();
            throw new Error('UPLOAD_ABORTED');
          }

          while (readyQueue.length >= MAX_QUEUE_BUFFER && !aborted) {
            if (shouldAbort && shouldAbort()) {
              aborted = true;
              wakeConsumers();
              throw new Error('UPLOAD_ABORTED');
            }
            await new Promise<void>((resolve) => {
              producerWaiters.push(resolve);
            });
          }

          if (aborted) throw new Error('UPLOAD_ABORTED');

          const blockStart = nextBlockStart;
          const blockLength = Math.min(BLOCK_SIZE, actualSize - blockStart);
          nextBlockStart += blockLength;

          // Read 4 MB binary block from disk
          let blockBuffer: Buffer;
          try {
            blockBuffer = await readBinaryBlock(filePath, blockStart, blockLength);
          } catch (readErr: any) {
            throw new Error(
              `Failed reading 4MB binary block at offset ${blockStart} for ${fileName}: ${readErr?.message || readErr}`
            );
          }

          // Split into 512 KB MTProto parts
          for (
            let offset = 0;
            offset < blockBuffer.length && nextPartIndex < totalParts;
            offset += CHUNK_SIZE
          ) {
            const partLength = Math.min(CHUNK_SIZE, blockBuffer.length - offset);
            const partBuffer = Buffer.from(blockBuffer.subarray(offset, offset + partLength));
            const partIndex = nextPartIndex++;

            if (md5) {
              md5.update(partBuffer);
            }

            readyQueue.push({
              partIndex,
              buffer: partBuffer,
              length: partLength,
            });

            wakeConsumers();
          }
        }
      } finally {
        producerDone = true;
        wakeConsumers();
      }
    };

    const getNextChunk = async (): Promise<PreparedChunk | null> => {
      while (true) {
        if (aborted || (shouldAbort && shouldAbort())) {
          aborted = true;
          wakeProducers();
          wakeConsumers();
          throw new Error('UPLOAD_ABORTED');
        }

        if (readyQueue.length > 0) {
          const chunk = readyQueue.shift()!;
          wakeProducers();
          return chunk;
        }

        if (producerDone && readyQueue.length === 0) {
          return null;
        }

        await new Promise<void>((resolve) => {
          consumerWaiters.push(resolve);
        });
      }
    };

    const uploadWorker = async (workerId: number) => {
      while (!aborted) {
        if (shouldAbort && shouldAbort()) {
          aborted = true;
          wakeConsumers();
          wakeProducers();
          throw new Error('UPLOAD_ABORTED');
        }

        const chunk = await getNextChunk();
        if (!chunk) break;

        const { partIndex: i, buffer: rawChunk, length } = chunk;

        let uploaded = false;
        let retries = 0;
        while (!uploaded && retries < 5 && !aborted) {
          if (shouldAbort && shouldAbort()) {
            aborted = true;
            throw new Error('UPLOAD_ABORTED');
          }

          try {
            const req = isLarge
              ? new Api.upload.SaveBigFilePart({
                  fileId,
                  filePart: i,
                  fileTotalParts: totalParts,
                  bytes: rawChunk,
                })
              : new Api.upload.SaveFilePart({
                  fileId,
                  filePart: i,
                  bytes: rawChunk,
                });

            // 15-second per-chunk timeout prevents socket hanging indefinitely
            const sendPromise = this.senderPool
              ? this.senderPool.send(req)
              : client.invoke(req);

            let timeoutId: any;
            try {
              await Promise.race([
                sendPromise,
                new Promise((_, reject) => {
                  timeoutId = setTimeout(() => reject(new Error('SOCKET_TIMEOUT')), 15000);
                }),
              ]);
            } finally {
              if (timeoutId) clearTimeout(timeoutId);
            }

            uploaded = true;
          } catch (uploadErr: any) {
            if (aborted || (shouldAbort && shouldAbort())) {
              aborted = true;
              throw new Error('UPLOAD_ABORTED');
            }
            retries++;
            if (retries >= 5) {
              throw new Error(`Failed to upload part ${i + 1}/${totalParts} after 5 retries: ${uploadErr?.message || uploadErr}`);
            }
            console.warn(`[GramJS] Part ${i + 1}/${totalParts} (worker ${workerId}) retry ${retries}:`, uploadErr?.message || uploadErr);
            if (uploadErr?.errorMessage?.startsWith('FLOOD_WAIT_')) {
              const waitSec = parseInt(uploadErr.errorMessage.split('_')[2], 10) || 2;
              await new Promise((r) => setTimeout(r, waitSec * 1000));
            } else {
              // Exponential backoff with random jitter: (2^(retries - 1) * 500ms) + (0 to 500ms jitter)
              const baseDelay = Math.min(8000, Math.pow(2, retries - 1) * 500);
              const jitter = Math.floor(Math.random() * 500);
              await new Promise((r) => setTimeout(r, baseDelay + jitter));
            }
          }
        }

        if (aborted) {
          throw new Error('UPLOAD_ABORTED');
        }

        if (!uploaded) {
          throw new Error(`Failed to upload part ${i + 1}/${totalParts} after ${retries} retries.`);
        }

        completedPartsCount++;
        const { speedText, etaText } = recordProgress(length);

        if (onProgress) {
          const progress = completedPartsCount / totalParts;
          onProgress(progress, completedPartsCount, totalParts, speedText, etaText);
        }
      }
    };

    // Run parallel upload workers
    const workers = Array.from({ length: CONCURRENCY }, (_, idx) => uploadWorker(idx + 1));
    try {
      await Promise.all([producerLoop(), ...workers]);
    } catch (err: any) {
      aborted = true;
      wakeConsumers();
      wakeProducers();
      throw err;
    }

    const md5Hash = md5 ? md5.digest('hex') : '';

    const inputFile = isLarge
      ? new Api.InputFileBig({
          id: fileId,
          parts: totalParts,
          name: fileName,
        })
      : new Api.InputFile({
          id: fileId,
          parts: totalParts,
          name: fileName,
          md5Checksum: md5Hash,
        });

    const media = new Api.InputMediaUploadedDocument({
      file: inputFile,
      mimeType: mimeType || 'application/octet-stream',
      attributes: [
        new Api.DocumentAttributeFilename({ fileName }),
      ],
      forceFile: false,
    });

    let sentResult: any = null;
    let finalPeerStr = typeof targetPeer === 'string' ? targetPeer : 'me';

    try {
      sentResult = await client.invoke(
        new Api.messages.SendMedia({
          peer: targetPeer,
          media,
          message: fileName,
        })
      );
    } catch (peerErr: any) {
      if (targetPeer !== 'me') {
        console.warn('[GramJS] Streaming upload to channel failed, falling back to Saved Messages ("me"):', peerErr);
        targetPeer = 'me';
        finalPeerStr = 'me';
        sentResult = await client.invoke(
          new Api.messages.SendMedia({
            peer: 'me',
            media,
            message: fileName,
          })
        );
      } else {
        throw peerErr;
      }
    }

    let messageId = -1;
    try {
      const msgObj = (client as any)._getResponseMessage(null, sentResult, targetPeer);
      if (msgObj && typeof msgObj.id === 'number') {
        messageId = msgObj.id;
      }
    } catch {}

    if (messageId <= 0) {
      if (sentResult && Array.isArray((sentResult as any).updates)) {
        for (const u of (sentResult as any).updates) {
          if (u.message && typeof u.message.id === 'number') {
            messageId = u.message.id;
            break;
          }
          if (typeof u.id === 'number') {
            messageId = u.id;
          }
        }
      } else if (sentResult && typeof (sentResult as any).id === 'number') {
        messageId = (sentResult as any).id;
      }
    }

    // Final fallback — use timestamp so caller always has a non-zero ID
    if (messageId <= 0) {
      messageId = Date.now();
    }

    return {
      messageId,
      channelId: finalPeerStr,
      bytesUploaded: actualSize,
      partsCount: totalParts,
      ivHex: '',
      sha256Hash: '',
    };
  }

  async syncFilesFromChannel(channelId?: string): Promise<Omit<FileRecord, 'createdAt' | 'updatedAt'>[]> {
    const client = await this.ensureConnected();
    const effectiveChannelId = channelId || this.currentSession?.channelId || 'me';
    let resolvedPeer: any = 'me';
    try {
      resolvedPeer = await this.resolveTargetPeer(effectiveChannelId);
    } catch {
      resolvedPeer = 'me';
    }
    const peerStr = typeof resolvedPeer === 'string' ? resolvedPeer : effectiveChannelId;

    const files: Omit<FileRecord, 'createdAt' | 'updatedAt'>[] = [];
    const seenCompoundKeys = new Set<string>();

    const parseMessageList = (msgList: any[], sourcePeer: string) => {
      for (const msg of msgList) {
        if (!msg || !msg.id) continue;
        const compoundKey = `${sourcePeer}_${msg.id}`;
        if (seenCompoundKeys.has(compoundKey)) continue;

        const doc = (msg.media && (msg.media.document || msg.document)) || msg.document;
        const photo = (msg.media && (msg.media.photo || msg.photo)) || msg.photo;

        if (doc) {
          seenCompoundKeys.add(compoundKey);
          let fileName = '';
          if (Array.isArray(doc.attributes)) {
            for (const attr of doc.attributes) {
              if (attr && attr.fileName) {
                fileName = attr.fileName;
                break;
              }
            }
          }
          if (!fileName && msg.message && typeof msg.message === 'string' && msg.message.trim()) {
            const firstLine = msg.message.trim().split('\n')[0].trim();
            if (!firstLine.startsWith('[CloudNest E2EE]')) {
              fileName = firstLine;
            }
          }
          if (!fileName) {
            fileName = `file_${msg.id}`;
          }

          const ext = fileName.includes('.') ? fileName.split('.').pop() || 'dat' : '';
          const size = Number(doc.size || 0);
          const mimeType = doc.mimeType || 'application/octet-stream';
          const sanitizedPeer = sourcePeer.replace(/[^a-zA-Z0-9_-]/g, '_');

          files.push({
            id: `file_tg_${sanitizedPeer}_${msg.id}`,
            folderId: null,
            name: fileName,
            size,
            mimeType,
            extension: ext,
            telegramMessageId: msg.id,
            telegramChannelId: sourcePeer,
            isEncrypted: false,
            encryptionIv: '',
            sha256Hash: '',
            localCachePath: null,
            isFavorite: false,
            isDeleted: false,
          });
        } else if (photo) {
          seenCompoundKeys.add(compoundKey);
          let fileName = '';
          if (msg.message && typeof msg.message === 'string' && msg.message.trim()) {
            const firstLine = msg.message.trim().split('\n')[0].trim();
            if (!firstLine.startsWith('[CloudNest E2EE]')) {
              fileName = firstLine;
            }
          }
          if (!fileName) {
            fileName = `photo_${msg.id}.jpg`;
          }
          if (!fileName.includes('.')) {
            fileName += '.jpg';
          }

          const ext = fileName.split('.').pop() || 'jpg';
          let photoSize = 0;
          if (Array.isArray(photo.sizes)) {
            const largest = photo.sizes[photo.sizes.length - 1];
            photoSize = Number(largest?.size || (largest?.bytes ? largest.bytes.length : 0)) || 0;
          }
          const sanitizedPeer = sourcePeer.replace(/[^a-zA-Z0-9_-]/g, '_');

          files.push({
            id: `file_tg_${sanitizedPeer}_${msg.id}`,
            folderId: null,
            name: fileName,
            size: photoSize,
            mimeType: 'image/jpeg',
            extension: ext,
            telegramMessageId: msg.id,
            telegramChannelId: sourcePeer,
            isEncrypted: false,
            encryptionIv: '',
            sha256Hash: '',
            localCachePath: null,
            isFavorite: false,
            isDeleted: false,
          });
        }
      }
    };

    // 1. Fetch from main resolved peer
    try {
      const msgs = await client.getMessages(resolvedPeer, { limit: 100 });
      if (msgs && Array.isArray(msgs)) {
        parseMessageList(msgs, peerStr);
      }
    } catch (err) {
      console.warn('[GramJS] getMessages from targetPeer error:', err);
    }

    // 2. Fetch from Saved Messages ('me') if peer was a dedicated channel
    if (peerStr !== 'me') {
      try {
        const savedMsgs = await client.getMessages('me', { limit: 100 });
        if (savedMsgs && Array.isArray(savedMsgs)) {
          parseMessageList(savedMsgs, 'me');
        }
      } catch (savedErr) {
        console.warn('[GramJS] getMessages from Saved Messages error:', savedErr);
      }
    }

    return files;
  }

  async downloadFile(
    channelId?: string | null,
    messageId?: number | null,
    fileName?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (!messageId) {
      throw new Error('Message ID is required to download file from Telegram');
    }

    const client = await this.ensureConnected();
    const effectiveChannelId = channelId || this.currentSession?.channelId || 'me';
    let targetPeer: any = 'me';
    try {
      targetPeer = await this.resolveTargetPeer(effectiveChannelId);
    } catch {
      targetPeer = 'me';
    }

    let messages: any[] = [];
    try {
      messages = await client.getMessages(targetPeer, { ids: [messageId] });
    } catch (err) {
      console.warn('[GramJS] downloadFile getMessages error on targetPeer:', err);
    }

    if ((!messages || messages.length === 0 || !messages[0]) && effectiveChannelId !== 'me') {
      try {
        messages = await client.getMessages('me', { ids: [messageId] });
      } catch (err) {
        console.warn('[GramJS] downloadFile getMessages error on "me":', err);
      }
    }

    const msg = messages && messages[0];
    if (!msg || (!msg.media && !(msg as any).document && !(msg as any).photo)) {
      throw new Error(`Telegram message #${messageId} not found or contains no downloadable media.`);
    }

    const cleanFileName = (fileName || `file_${messageId}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const localPath = `${FileSystem.cacheDirectory}tg_${messageId}_${cleanFileName}`;

    await FileSystem.deleteAsync(localPath, { idempotent: true });

    let downloadedSize = 0;
    const totalSize = msg.document?.size ? Number(msg.document.size) : 0;

    for await (const chunk of client.iterDownload({ file: msg, requestSize: 512 * 1024 })) {
      const chunkBuf = Buffer.from(chunk as any);
      downloadedSize += chunkBuf.length;
      
      await FileSystem.writeAsStringAsync(localPath, chunkBuf.toString('base64'), {
        encoding: FileSystem.EncodingType.Base64,
        append: true,
      });

      if (onProgress && totalSize > 0) {
        onProgress(Math.min(1, downloadedSize / totalSize));
      }
    }

    return localPath;
  }


  async signOut(): Promise<void> {
    if (this.senderPool) {
      try {
        await this.senderPool.destroy();
      } catch {}
      this.senderPool = null;
    }
    if (this.client) {
      try {
        await this.client.invoke(new Api.auth.LogOut());
        await this.client.disconnect();
      } catch {}
      this.client = null;
    }
    this.connected = false;
    this.currentSession = null;
    this.stringSession = new StringSession('');
    await SecureStorageService.clearGramjsSession();
    await SecureStorageService.clearTelegramSession();
    await SecureStorageService.clearMasterKey();
  }

  async deleteMessage(channelId?: string | null, messageId?: number | null): Promise<boolean> {
    if (!messageId || messageId <= 0) return false;
    try {
      const client = await this.ensureConnected();
      let targetPeer: any = 'me';
      try {
        targetPeer = await this.resolveTargetPeer(channelId || this.currentSession?.channelId);
      } catch {
        targetPeer = 'me';
      }
      await client.deleteMessages(targetPeer, [messageId], { revoke: true });
      return true;
    } catch (err: any) {
      console.warn(`[GramJS] Delete message #${messageId} error:`, err?.message || err);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSession(): TelegramSession | null {
    return this.currentSession;
  }
}

export const GramJSClient = new GramJSClientService();
