# Testing & Build

> Sources: `__tests__/*.mjs`, `package.json`, `app.json`, `eas.json`, `metro.config.js`, `index.js`, `shims/`. Verified 2026-09-25.

## Tests — 61/61 pass (`npm run test` → `node --test __tests__/*.mjs`, ~600 ms)

| File | Subtests | Covers |
|---|---|---|
| `cacheManager.test.mjs` | 4 | LRU eviction, formatBytes, 1 GB cache boundary |
| `chunking.test.mjs` | 2 | 1 MB chunk counts, chunk boundary constraints |
| `countries.test.mjs` | 5 | India +91 default, ISO code lookups, 5-5 split format, international parsing |
| `crypto.test.mjs` | 5 | Fingerprint, GCM roundtrip, SHA-256, CSPRNG random nonces |
| `mnemonic.test.mjs` | 9 | BIP39 standard 24-word recovery vectors, entropy roundtrip, checksum & word validation, 2048-word sorted list |
| `models.test.mjs` | 2 | DC4 Frankfurt, primary DCs validation |
| `mtproto.test.mjs` | 22 | DC endpoints, ping baselines, 512 KB parts, Saved Messages fallback, CTR length, pipelining sliding window, live speed smoothing, active speed dynamic sum, parallel upload slots (MAX_PARALLEL_UPLOADS = 4), channel matching, compound deduplication, 4 MB blocks / 8 x 512 KB part splitting, 32-chunk producer buffer, adaptive workers (>500MB -> 8, 10-500MB -> 4, <10MB -> 2), adaptive file limits, exponential smoothing speed formula, dynamic ETA formatting, and `MtprotoSenderPool` round-robin dispatch |
| `theme.test.mjs` | 4 | `#12131a`/`#F2F2F7` canvas, purple ban, radii/gutter |

Plus 8 file-level wrappers = 61 total. Other checks: `npm run lint` (`tsc --noEmit` — 0 errors), `npx expo-doctor` (21/21 passed).

## Build config

- `cloudnest@1.0.0`, `main:index.js`, Expo SDK 57 / React 19 / RN 0.86, `react-native-blob-util`, `expo-video`, `expo-media-library`, `expo-sharing`, `expo-router/sqlite/filesystem/secure-store/local-authentication`, GramJS `telegram@2.26`, `zustand`, `buffer/crypto-browserify` polyfills.
- `app.json`: `com.cloudnest.vault`, v1.0.0/vc1, portrait, media+biometric permissions, `#12131a` splash/status bar, `typedRoutes:true`.
- `eas.json`: `development`/`preview` APK-internal, `production` app-bundle auto-increment.
- `metro.config.js`: node-core → browser/shim mapping; `node-localstorage → shims/localStorage.js` (in-memory).
- APK artifacts (`android/app/build/outputs/apk/release/` & root):
  - `CloudNest-v1.0.0-arm64-release.apk`: **45.0 MB** (ARM64-v8a target, 56% size reduction via Gradle ABI splits).
  - `CloudNest-v1.0.0-release.apk`: **103.4 MB** (Universal multi-architecture bundle).
- High-Throughput MTProto Upload Engine: `react-native-blob-util` 4 MB binary reads, `MtprotoSenderPool` 4-sender socket pool, 32-chunk deep producer queue (~16 MB RAM buffer), and adaptive concurrency keep memory strictly bounded while maximizing network throughput.
