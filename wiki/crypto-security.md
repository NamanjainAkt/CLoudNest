# Zero-Knowledge Crypto & Security

> Sources: `services/crypto/{cipher,keyDerivation,mnemonic,secureStore,biometrics}.ts`, `services/storage/chunking.ts`, `components/settings/RecoveryPhraseModal.tsx`.

## What exists

- `cipher.ts`: AES-256-GCM via `crypto-browserify`; 12 B IV, 16 B auth tag, Base64 ciphertext + SHA-256(plaintext) digest. `decryptBuffer` restores via `setAuthTag`.
- `keyDerivation.ts`: `generateMasterSeed()` — 32 B from `expo-crypto`; `formatKeyFingerprint` (`0xXXXX…XXXX`, fallback `0x9F4C…82EA`).
- `mnemonic.ts`: custom 12-word recovery (NOT BIP39) with ~500-word a–d list; `seedHexToMnemonic` / `mnemonicToSeedHex`.
- `secureStore.ts` keys: `cloudnest_master_key`, `cloudnest_telegram_session`, `cloudnest_gramjs_session`, `cloudnest_app_pin`, `cloudnest_biometrics_enabled`, `cloudnest_recent_searches` (≤10), `cloudnest_max_cache_bytes`.
- `biometrics.ts`: Face → Fingerprint → Iris priority; app-launch + background-resume auto-lock in `app/_layout.tsx`; device-passcode fallback.

## Gaps (verified, load-bearing first)

1. **P0 — GCM auth tag never persisted.** `files` table has `encryption_iv` but no `auth_tag` column, so `decryptBuffer` cannot be fed from DB. The streaming uploader uses AES-256-CTR (no tag) — two divergent crypto paths; wiki §8 (GCM) vs §26/27 (CTR) need reconciliation.
2. **P0 — No PBKDF2.** `keyDerivation.ts` docstring claims PBKDF2-HMAC-SHA512/100k iterations; implementation is raw CSPRNG output — no password stretching, salt, or iterations.
3. **P0 — Lossy mnemonic round-trip.** `seed→words→seed ≠ identity` (modulo mapping + self-duplicated halves); no checksum/entropy validation; truncated wordlist; unknown words silently remapped.
4. **P1 — Biometric bypass.** `authenticate()` returns `true` when no hardware/enrolled; no auto-lock timeout; master key not hardware-bound (gate only).
5. **P1 — PIN stored plaintext** in SecureStore; no `kSecAccessControl` biometric binding.
6. **P2 — `chunking.ts` (1 MB GCM chunker) is dead code** — sync uses 512 KB CTR streaming; full-file `atob/btoa` buffering would OOM on Hermes.
