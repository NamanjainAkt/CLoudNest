# System Architecture

> Sources: `app/_layout.tsx`, `app/index.tsx`, `index.js`, `metro.config.js`, `shims/`, `AGENTS.md`, root `WIKI.md` §1.

## Dataflow

`React Native UI (12 Expo Router screens)` → `BiometricLockOverlay` gate → `useVaultStore` (Zustand) → `SQLite VFS` + `LRU CacheManager` → `GramJS WSS client` → `DC edge router (default Frankfurt DC4)` → `private vault channel` (fallback: Saved Messages `me`) → plaintext blobs. (Encryption removed 2026-10-04 — former `AES-256-GCM/CTR crypto ↔ SecureStore` hop no longer transforms bytes; see `crypto-security.md`.)

## Boot order (verified)

1. `index.js` imports `services/telegram/polyfill` FIRST (before `expo-router/entry`) — guarantees `global.crypto.getRandomValues`, `Buffer`, `process`, `window/location` spoof exist before `randombytes`/`crypto-browserify`/`telegram` evaluate.
2. `app/_layout.tsx` `RootLayout`: `SafeAreaProvider > ThemeProvider > Stack` + `BiometricLockOverlay`; starts `BackgroundSync.startQueueWatcher(3000)`; `AppState` listener re-locks on background/inactive when biometric lock enabled.
3. `app/index.tsx` boot gate: `session?.isConnected ? replace('/(tabs)') : replace('/(auth)/onboarding')`.
4. `store/useVaultStore.initialize()`: `getDb()` (migrate + purge legacy mocks) + `MTProtoClient.init()` + `loadVaultData()`.

## Module map

| Layer | Paths |
|---|---|
| Routes (12 screens + boot) | `app/index.tsx`, `app/(auth)/{onboarding,sign-in,otp-verify,create-vault}.tsx`, `app/(tabs)/{index,search,uploads,settings}.tsx`, `app/folder/[folderId].tsx`, `app/file/[fileId].tsx`, `app/trash.tsx` |
| UI components (23 files) | `components/{common,auth,dashboard,file-manager,queue,settings}/` (see `ui-screens.md`) |
| Design engine | `theme/{colors,typography,spacing}.ts`, `theme/ThemeContext.tsx` (no `shadows.ts` despite AGENTS.md §5.1 listing it) |
| VFS + DAO | `services/db/{schema,dbClient}.ts` |
| Crypto (removed — dead code, see `crypto-security.md`) | `services/crypto/{cipher,keyDerivation,mnemonic,secureStore,biometrics}.ts` (only SecureStore session/prefs + biometric gate still functional) |
| Transport | `services/telegram/{types,polyfill,mtprotoClient,gramjsClient,countries}.ts` |
| Storage/sync | `services/storage/{chunking,cacheManager}.ts`, `services/sync/backgroundSync.ts` |
| State | `store/useVaultStore.ts` |
| Metro shims | `metro.config.js` redirects `net/tls/fs/os → shims/`, `node-localstorage → shims/localStorage.js`, `websocket → websocket/lib/browser.js` |

## Gaps

- `BackgroundSync` is a foreground `setInterval` only — dies in background/kill; no `expo-task-manager` daemon.
- Upload queue lives in Zustand memory; `upload_queue` SQL table is never written — queue lost on reload.
