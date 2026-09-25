# CloudNest Wiki Index

> LLM-owned synthesis. Raw inputs: root `WIKI.md` (= `docs/WIKI.md`, byte-identical), `AGENTS.md`, `CloudNest_PRD_v1.0.md`, `docs/PLAN-cloudnest-mobile.md`, full `app/` + `components/` + `services/` + `theme/` + `store/` source read.
> Last full ingestion: 2026-09-25. Tests verified 42/42 pass (`npm run test`).

## Pages

| Page | Covers | Primary sources |
|---|---|---|
| [architecture](architecture.md) | System dataflow, module map, directory layout | `app/_layout.tsx`, `index.js`, `metro.config.js`, `shims/` |
| [auth-telegram](auth-telegram.md) | Auth flow, country selector, MTProto transport, DC routing, GramJS, peer resolution | `app/(auth)/`, `services/telegram/`, `components/auth/` |
| [crypto-security](crypto-security.md) | AES-GCM cipher, key derivation gap, 12-word mnemonic gaps, SecureStore, biometrics | `services/crypto/` |
| [ui-screens](ui-screens.md) | All 12 screens, component inventory, Stitch tokens, quality gaps | `app/(tabs)/`, `app/folder/`, `app/file/`, `app/trash.tsx`, `components/`, `theme/` |
| [storage-sync](storage-sync.md) | SQLite VFS schema + DAO, LRU cache, chunking, background sync, Zustand store | `services/db/`, `services/storage/`, `services/sync/`, `store/useVaultStore.ts`, `services/types/models.ts` |
| [testing-build](testing-build.md) | Test inventory, lint, build configs, shims, APK artifact | `__tests__/`, `package.json`, `app.json`, `eas.json`, `metro.config.js` |
| [known-gaps](known-gaps.md) | Consolidated P0/P1 defects + doc-maintenance backlog | all of the above |

## Canonical specs (read-only pointers, not wiki-owned)

- Product/architecture narrative: root `WIKI.md` §§1–27 (and identical `docs/WIKI.md`).
- Agent handbook + Stitch tokens: `AGENTS.md`.
- Stitch token source: `stitch_cloudnest_ui_design_system/cloudnest_system/DESIGN.md`.
- PRD: `CloudNest_PRD_v1.0.md`. Task plan: `docs/PLAN-cloudnest-mobile.md`.
