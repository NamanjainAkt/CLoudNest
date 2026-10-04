# Known Gaps & Maintenance Backlog

> Consolidated from full 2026-09-25 ingestion. P0 = data-loss/security/correctness.

## P0

1. ~~GCM auth tag never persisted (`files` lacks `auth_tag`) — DB-backed decrypt path unusable; CTR (streaming) vs GCM (cipher/chunking) divergence unreconciled.~~ **SUPERSEDED 2026-10-04: file-content encryption removed entirely.** Live upload (`uploadFileStreaming`) and download (`downloadFile`) move plaintext; `cipher.ts`/`chunking.ts` are dead code; `backgroundSync` writes `isEncrypted:false`/`encryptionIv:''`. The old GCM-vs-CTR divergence is moot — the problem is now stale zero-knowledge claims (items 8–10 below).
2. ~~No PBKDF2 despite `keyDerivation.ts` docstring + wiki §8 claiming 100k HMAC-SHA512 — master key is raw CSPRNG output.~~ **MOOT 2026-10-04:** no file bytes are encrypted, so there is nothing to stretch a key for. `generateMasterSeed` output is stored but unused.
3. ~~Lossy mnemonic round-trip~~ — **RESOLVED (2026-09-26)**: BIP39 standard 24-word recovery implemented in `services/crypto/mnemonic.ts` with official BIP39 test vectors, checksum verification, and wordlist validation (9 unit tests).
4. ~~Upload queue ephemeral~~ — **RESOLVED (2026-09-27)**: `upload_queue_v2` table added to SQLite and completely wired to Zustand with `currentChunk` persistence for full crash-resilience and chunk-level resume. (Note: still no background daemon).
5. Biometric `authenticate()` returns `true` with no hardware — fail-open; key not hardware-bound.
6. Hardcoded Telegram `apiId/apiHash` fallbacks ship live creds in the bundle.
7. RNG `Math.random` last-tier fallback can feed nonces/IVs if `expo-crypto` unready.
8. **Stale zero-knowledge / E2EE claims everywhere (2026-10-04).** Root `WIKI.md` + `docs/WIKI.md` (§§8, 17, 27), `AGENTS.md`, `CloudNest_PRD_v1.0.md`, store-listing copy (`AES-256 encrypted files`), in-app copy (`Encrypted`, `Protected & Verified`, `End-to-End Encrypted`), `[CloudNest E2EE]` captions, and `.enc` suffixes all imply client-side encryption that no longer happens. Either re-introduce encryption or scrub every claim before any store submission.
9. **Dead crypto surface still ships (2026-10-04).** UI recovery flows removed same day (`backup-phrase.tsx`, `RestoreVaultModal`, `RecoveryPhraseModal` deleted; sign-in unmounted). Remaining non-UI dead surface: `cipher.ts`, `chunking.ts`, `mnemonic.ts`, unused `cloudnest_master_key`, `is_encrypted`/`encryption_iv` columns, and the never-entered `encrypting` queue state — delete or reinstate encryption.
10. **Play E2EE exemption invalid (2026-10-04).** Data safety was filed treating file contents as end-to-end-encrypted; with plaintext storage that basis is gone — see `play-compliance.md` P0.

## P1

- N+1 folder stats; divergent category taxonomies; full-reload mutations.
- ~~Hardcoded '4.2 MB/s' seed speed~~ — **RESOLVED (2026-09-27)**: Seed speed initialized to `'0 MB/s'` and dynamically calculated via 500ms sampling window with exponential smoothing (`0.7 * prev + 0.3 * inst`).
- ~~File loss on reinstall~~ — **RESOLVED (2026-09-27)**: Auto-scans Telegram channels and Saved Messages on login, boot, and pull-to-refresh to restore SQLite VFS metadata.
- Zero lists set `removeClippedSubviews/maxToRenderPerBatch/windowSize`; only 2 components `memo`.
- Systematic <44pt touch targets (chips, icon buttons, checkboxes, modal buttons).
- Dead: `upload_queue`/`app_settings` tables, `chunking.ts`, `TelemetryBadge`, `showEnclaveBadge`, breadcrumb null-branch, `sizeMB` fallback.
- Theme toggle not persisted; light-mode hardcoded-color leaks in sheets/preview.
- 2FA `SESSION_PASSWORD_NEEDED` unsupported; no `FLOOD_WAIT` engine outside streaming uploader; DC IPs hardcoded.

## Doc-maintenance backlog

- [x] 2026-09-25: root `WIKI.md` banner + §11 test count 36 → 42 (verified by run); TOC extended to §§13–27; duplicate `## 14.` renumbered (→15–27 cascade). Applied identically to `docs/WIKI.md` (byte-identical invariant kept — hashes must match after edit).
- [ ] Adopt single source: keep `docs/WIKI.md`, turn root `WIKI.md` into a pointer (or vice versa). `docs/PLAN-cloudnest-mobile.md:204` mandates dual updates — drift risk.
- [ ] Fix stale wiki paths (§6 LRU cites only `dbClient.ts`; transport cites only `mtprotoClient.ts` — add `gramjsClient.ts/polyfill.ts/countries.ts`), and `docs/PLAN` stale 36/36 + `2026-09-24` checklist date.
- [ ] Reconcile wiki §8 (GCM) vs §27 (CTR) crypto narrative once P0-1 is fixed.
- [ ] Scrub-or-restore decision on encryption (2026-10-04): root `WIKI.md` + `docs/WIKI.md` need the same plaintext-storage correction as `wiki/` (byte-identical invariant); store listing + privacy policy + in-app copy must match whichever direction is chosen.
