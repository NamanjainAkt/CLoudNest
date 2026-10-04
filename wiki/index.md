# CloudNest Wiki Index

> LLM-owned synthesis. Raw inputs: root `WIKI.md` (= `docs/WIKI.md`, byte-identical), `AGENTS.md`, `CloudNest_PRD_v1.0.md`, `docs/PLAN-cloudnest-mobile.md`, full `app/` + `components/` + `services/` + `theme/` + `store/` source read, Play Console UI.
> Last full update: 2026-09-30 (Play compliance page added). Tests verified 61/61 pass (`npm run test`).

## Pages

| Page | Covers | Primary sources |
|---|---|---|
| [architecture](architecture.md) | System dataflow, module map, directory layout | `app/_layout.tsx`, `index.js`, `metro.config.js`, `shims/` |
| [auth-telegram](auth-telegram.md) | Auth flow, country selector, MTProto transport, DC routing, GramJS, peer resolution | `app/(auth)/`, `services/telegram/`, `components/auth/` |
| [crypto-security](crypto-security.md) | Encryption REMOVED 2026-10-04: plaintext on Telegram, dead cipher/mnemonic leftovers, SecureStore sessions, biometrics gate | `services/crypto/` |
| [ui-screens](ui-screens.md) | All 12 screens, component inventory, Stitch tokens, in-app previews, quality gaps | `app/(tabs)/`, `app/folder/`, `app/file/`, `app/trash.tsx`, `components/`, `theme/` |
| [storage-sync](storage-sync.md) | SQLite VFS schema + DAO, LRU cache, chunking, background sync, high-throughput upload engine, Zustand store | `services/db/`, `services/storage/`, `services/sync/`, `store/useVaultStore.ts`, `services/types/models.ts` |
| [testing-build](testing-build.md) | Test inventory (61/61 pass), lint, build configs, shims, APK artifacts | `__tests__/`, `package.json`, `app.json`, `eas.json`, `metro.config.js` |
| [play-compliance](play-compliance.md) | Play Console Data safety declaration + submitted answers, code evidence per answer, release blockers | `services/telegram/gramjsClient.ts`, `store/useVaultStore.ts`, Play Console |
| [known-gaps](known-gaps.md) | Consolidated P0/P1 defects + doc-maintenance backlog | all of the above |

## Canonical specs (read-only pointers, not wiki-owned)

- Product/architecture narrative: root `WIKI.md` §§1–30 (and identical `docs/WIKI.md`).
- Agent handbook + Stitch tokens: `AGENTS.md`.
- Stitch token source: `stitch_cloudnest_ui_design_system/cloudnest_system/DESIGN.md`.
- PRD: `CloudNest_PRD_v1.0.md`. Task plan: `docs/PLAN-cloudnest-mobile.md`.
