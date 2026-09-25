# Known Gaps & Maintenance Backlog

> Consolidated from full 2026-09-25 ingestion. P0 = data-loss/security/correctness.

## P0

1. GCM auth tag never persisted (`files` lacks `auth_tag`) — DB-backed decrypt path unusable; CTR (streaming) vs GCM (cipher/chunking) divergence unreconciled.
2. No PBKDF2 despite `keyDerivation.ts` docstring + wiki §8 claiming 100k HMAC-SHA512 — master key is raw CSPRNG output.
3. Lossy mnemonic round-trip (modulo mapping, no checksum) — restore may derive a different key.
4. Upload queue ephemeral (SQL `upload_queue` table unwired) + foreground-only `setInterval` sync — no background daemon, no resume, restarts at part 0.
5. Biometric `authenticate()` returns `true` with no hardware — fail-open; key not hardware-bound.
6. Hardcoded Telegram `apiId/apiHash` fallbacks ship live creds in the bundle.
7. RNG `Math.random` last-tier fallback can feed nonces/IVs if `expo-crypto` unready.

## P1

- N+1 folder stats; divergent category taxonomies; full-reload mutations; hardcoded `'4.2 MB/s'` seed speed.
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
