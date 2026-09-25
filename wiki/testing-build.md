# Testing & Build

> Sources: `__tests__/*.mjs`, `package.json`, `app.json`, `eas.json`, `metro.config.js`, `index.js`, `shims/`. Verified 2026-09-25.

## Tests — 42/42 pass (`npm run test` → `node --test __tests__/*.mjs`, ~350 ms)

| File | Subtests | Covers |
|---|---|---|
| `cacheManager.test.mjs` | 4 | LRU eviction |
| `chunking.test.mjs` | 2 | 1 MB chunk counts |
| `countries.test.mjs` | 5 | India +91 default |
| `crypto.test.mjs` | 5 | Fingerprint, GCM roundtrip, SHA-256, `randombytes` 16/32 B nonces |
| `mnemonic.test.mjs` | 3 | 12-word roundtrip (note: lossy in prod — see `crypto-security.md`) |
| `models.test.mjs` | 2 | DC4 Frankfurt |
| `mtproto.test.mjs` | 9 | DC endpoints, ping baselines 38/44/82/92, 512 KB parts, `me` fallback, CTR length |
| `theme.test.mjs` | 4 | `#12131a`/`#F2F2F7` canvas, purple ban, radii/gutter |

Plus 8 file-level wrappers = 42 total. Other checks: `npm run lint` (`tsc --noEmit`), `npx expo-doctor` (21/21 claimed in wiki — rerun before release).

## Build config

- `cloudnest@1.0.0`, `main:index.js`, Expo SDK 57 / React 19 / RN 0.86, `expo-router/sqlite/filesystem/secure-store/local-authentication`, GramJS `telegram@2.26`, `zustand`, `buffer/crypto-browserify` polyfills.
- `app.json`: `com.cloudnest.vault`, v1.0.0/vc1, portrait, media+biometric permissions, `#12131a` splash/status bar, `typedRoutes:true`.
- `eas.json`: `development`/`preview` APK-internal, `production` app-bundle auto-increment.
- `metro.config.js`: node-core → browser/shim mapping; `node-localstorage → shims/localStorage.js` (in-memory).
- APK artifact: `android/app/build/outputs/apk/release/app-release.apk` (~97.9 MB, Hermes 4 ABIs, debug-signed sideload).
- `largeHeap=true` + 512 KB sequential reads + CTR streaming keep peak RAM <3 MB for any file size (see root `WIKI.md` §27).
