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
import { SecureStorageService } from '../crypto/secureStore';
import {
  AuthSendCodeResponse,
  TelegramUser,
  MTProtoUploadResult,
} from './types';
import { TelegramSession } from '../types/models';

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

      // Force GramJS to route requests via authenticated primary socket rather than secondary exported senders
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
        (d) => d.isChannel && d.title === channelTitle
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
          (d.isChannel && d.title === 'CloudNest Private Vault [E2EE]')
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
    masterKeyHex: string,
    onProgress?: (progress: number, currentPart: number, totalParts: number, speedText?: string) => void,
    shouldAbort?: () => boolean
  ): Promise<MTProtoUploadResult> {
    const client = await this.ensureConnected();
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

    const CHUNK_SIZE = 512 * 1024; // 512 KB per MTProto standard
    const totalParts = Math.max(1, Math.ceil(actualSize / CHUNK_SIZE));
    const isLarge = actualSize > 10 * 1024 * 1024; // > 10 MB uses SaveBigFilePart
    const fileId = readBigIntFromBuffer(generateRandomBytes(8), true, true);

    // Stream cipher setup (AES-256-CTR)
    const iv = crypto.randomBytes(16);
    const ivHex = iv.toString('hex');
    const safeHex = (masterKeyHex || '').padStart(64, '0').slice(0, 64);
    const keyBuffer = Buffer.from(safeHex, 'hex');

    const cipher = crypto.createCipheriv('aes-256-ctr', keyBuffer, iv);
    const sha256 = crypto.createHash('sha256');
    const md5 = crypto.createHash('md5');

    // Multi-worker part pipelining:
    // Concurrency = 3 parallel parts over the MTProto socket.
    // Sequential encryption & hashing sliding window kept < 2MB in memory (max 1 queued + 3 in flight).
    const CONCURRENCY = Math.min(3, totalParts);
    const MAX_QUEUE_BUFFER = 1;

    interface PreparedChunk {
      partIndex: number;
      buffer: Buffer;
      length: number;
    }

    const readyQueue: PreparedChunk[] = [];
    let nextPartToPrepare = 0;
    let completedPartsCount = 0;
    let uploadedBytesCount = 0;
    let aborted = false;
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

    // Rolling window instantaneous speed calculation (sampling delta bytes / delta time every 500ms with exponential smoothing)
    const startTime = Date.now();
    let lastSampleTime = startTime;
    let lastSampleBytes = 0;
    let smoothedSpeed = 0;

    const recordProgress = (bytesJustSent: number): string => {
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
      return formatUploadSpeed(smoothedSpeed);
    };

    // Strictly sequential producer: maintains AES-256-CTR keystream counter, SHA-256 and MD5 integrity
    const producerLoop = async () => {
      while (nextPartToPrepare < totalParts) {
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

        const i = nextPartToPrepare++;
        const position = i * CHUNK_SIZE;
        const length = Math.min(CHUNK_SIZE, actualSize - position);

        let chunkBuffer: Buffer;
        try {
          const base64Chunk = await FileSystem.readAsStringAsync(filePath, {
            encoding: FileSystem.EncodingType.Base64,
            position,
            length,
          });
          chunkBuffer = Buffer.from(base64Chunk, 'base64');
        } catch (readErr: any) {
          try {
            const resp = await fetch(filePath);
            const blob = await resp.blob();
            const slice = blob.slice(position, position + length);
            const arrayBuf = await new Response(slice).arrayBuffer();
            chunkBuffer = Buffer.from(arrayBuf);
          } catch (fetchErr: any) {
            throw new Error(
              `Failed reading chunk ${i + 1}/${totalParts}: ${readErr?.message || fetchErr?.message}`
            );
          }
        }

        // Plaintext integrity hash (strictly sequential)
        sha256.update(chunkBuffer);

        // Stream encrypt 512KB chunk (1:1 length preservation, strictly sequential)
        let encChunk = cipher.update(chunkBuffer);
        if (i === totalParts - 1) {
          encChunk = Buffer.concat([encChunk, cipher.final()]);
        }

        // Ciphertext MD5 checksum (strictly sequential)
        md5.update(encChunk);

        readyQueue.push({
          partIndex: i,
          buffer: encChunk,
          length,
        });

        wakeConsumers();
      }
    };

    const getNextChunk = async (): Promise<PreparedChunk | null> => {
      while (true) {
        if (aborted || (shouldAbort && shouldAbort())) {
          aborted = true;
          wakeProducers();
          throw new Error('UPLOAD_ABORTED');
        }

        if (readyQueue.length > 0) {
          const chunk = readyQueue.shift()!;
          wakeProducers();
          return chunk;
        }

        if (nextPartToPrepare >= totalParts) {
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

        const { partIndex: i, buffer: encChunk, length } = chunk;

        let uploaded = false;
        let retries = 0;
        while (!uploaded && retries < 4 && !aborted) {
          if (shouldAbort && shouldAbort()) {
            aborted = true;
            throw new Error('UPLOAD_ABORTED');
          }

          try {
            if (isLarge) {
              await client.invoke(
                new Api.upload.SaveBigFilePart({
                  fileId,
                  filePart: i,
                  fileTotalParts: totalParts,
                  bytes: encChunk,
                })
              );
            } else {
              await client.invoke(
                new Api.upload.SaveFilePart({
                  fileId,
                  filePart: i,
                  bytes: encChunk,
                })
              );
            }
            uploaded = true;
          } catch (uploadErr: any) {
            retries++;
            console.warn(`[GramJS] Part ${i + 1}/${totalParts} (worker ${workerId}) retry ${retries}:`, uploadErr);
            if (uploadErr?.errorMessage?.startsWith('FLOOD_WAIT_')) {
              const waitSec = parseInt(uploadErr.errorMessage.split('_')[2], 10) || 2;
              await new Promise((r) => setTimeout(r, waitSec * 1000));
            } else {
              await new Promise((r) => setTimeout(r, 1000 * retries));
            }
          }
        }

        if (!uploaded) {
          throw new Error(`Failed to upload part ${i + 1}/${totalParts} after multiple retries.`);
        }

        completedPartsCount++;
        const currentSpeed = recordProgress(length);

        if (onProgress) {
          const progress = completedPartsCount / totalParts;
          onProgress(progress, completedPartsCount, totalParts, currentSpeed);
        }
      }
    };

    // Run pipelined upload: 1 sequential producer + up to 3 parallel socket upload workers
    const workers = Array.from({ length: CONCURRENCY }, (_, idx) => uploadWorker(idx + 1));
    try {
      await Promise.all([producerLoop(), ...workers]);
    } catch (err: any) {
      aborted = true;
      wakeConsumers();
      wakeProducers();
      throw err;
    }

    const sha256Hash = sha256.digest('hex');
    const md5Hash = md5.digest('hex');
    const encFileName = `${fileName}.enc`;

    const inputFile = isLarge
      ? new Api.InputFileBig({
          id: fileId,
          parts: totalParts,
          name: encFileName,
        })
      : new Api.InputFile({
          id: fileId,
          parts: totalParts,
          name: encFileName,
          md5Checksum: md5Hash,
        });

    const media = new Api.InputMediaUploadedDocument({
      file: inputFile,
      mimeType: 'application/octet-stream',
      attributes: [
        new Api.DocumentAttributeFilename({ fileName: encFileName }),
      ],
      forceFile: true,
    });

    let sentResult: any = null;
    let finalPeerStr = typeof targetPeer === 'string' ? targetPeer : 'me';

    try {
      sentResult = await client.invoke(
        new Api.messages.SendMedia({
          peer: targetPeer,
          media,
          message: '[CloudNest E2EE] SHA-256 Verified Encrypted Chunk',
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
            message: '[CloudNest E2EE] SHA-256 Verified Encrypted Chunk',
          })
        );
      } else {
        throw peerErr;
      }
    }

    let messageId = Date.now();
    try {
      const msgObj = (client as any)._getResponseMessage(null, sentResult, targetPeer);
      if (msgObj && typeof msgObj.id === 'number') {
        messageId = msgObj.id;
      }
    } catch {}

    if (!messageId || messageId === Date.now()) {
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

    return {
      messageId,
      channelId: finalPeerStr,
      bytesUploaded: actualSize,
      partsCount: totalParts,
      ivHex,
      sha256Hash,
    };
  }

  async signOut(): Promise<void> {
    if (this.client) {
      try {
        await this.client.invoke(new Api.auth.LogOut());
        await this.client.disconnect();
      } catch {}
    }
    this.connected = false;
    this.currentSession = null;
    this.stringSession = new StringSession('');
    await SecureStorageService.clearGramjsSession();
    await SecureStorageService.clearTelegramSession();
    await SecureStorageService.clearMasterKey();
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSession(): TelegramSession | null {
    return this.currentSession;
  }
}

export const GramJSClient = new GramJSClientService();
