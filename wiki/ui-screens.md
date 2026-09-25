# UI Screens, Components & Design Tokens

> Sources: all of `app/`, all 23 files in `components/`, `theme/{colors,typography,spacing}.ts`, `theme/ThemeContext.tsx`.

## 12 screens

| # | Screen | Route file |
|---|---|---|
| 1 | Splash & Onboarding (3 plain-English slides, badges scrubbed of RAW/P2P jargon) | `app/(auth)/onboarding.tsx` |
| 2 | Sign In (IN +91 default, paste-detect, 12-word restore modal) | `app/(auth)/sign-in.tsx` |
| 3 | OTP (5/6-digit slots, 42 s timer, custom keypad) | `app/(auth)/otp-verify.tsx` |
| 4 | Creating Vault (4 milestones, orbital SVG) | `app/(auth)/create-vault.tsx` |
| 5 | Home Dashboard (storage card, categories, recents, folder grid, FAB 56) | `app/(tabs)/index.tsx` |
| 6 | Folder Browser (breadcrumbs, sort modal, grid/list, action sheets; 1009 lines) | `app/folder/[folderId].tsx` |
| 7 | Upload Bottom Sheet (document/image/camera/new-folder grid) | `components/file-manager/UploadBottomSheet.tsx` |
| 8 | Uploads Queue (filters, `QueueItemRow`, pause/retry) | `app/(tabs)/uploads.tsx` |
| 9 | File Details (preview frame, zoom, metadata bento, share via `expo-sharing`) | `app/file/[fileId].tsx` |
| 10 | Search (debounced FTS-LIKE, category chips, persistent history ≤8, sort/filter modal) | `app/(tabs)/search.tsx` |
| 11 | Settings (Telegram account, storage/cache metrics, theme toggle, biometrics, recovery phrase, trash link) | `app/(tabs)/settings.tsx` |
| 12 | Trash (30-day countdown, sort cycle, bulk restore/purge bar) | `app/trash.tsx` |

Plus `app/index.tsx` boot gate and `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx` shells. UI copy is jargon-scrubbed except `BiometricLockOverlay` ("AES-256-GCM zero-knowledge vault") and `FullScreenPreviewModal` ("DECRYPTED IN-MEMORY BUFFER / authentic GCM tag").

## Tokens (Stitch)

- Dark canvas `#12131a` / lowest `#0d0e15`; light `#F2F2F7`; primary `#adc6ff`/`#4d8eff` dark, `#007AFF` light; purple ban respected (verified by test).
- Typography: 11 styles; `monoSm` falls back to Courier (JetBrains Mono not bundled).
- `ThemeContext` defaults dark unless OS light; **no persistence** — toggle is session-only.
- `spacing`/`Radii` (`full9999`, `default16`, `gutter16`) exist but most files hardcode padding.

## Quality gaps (verified across all screens)

- **FlatList perf:** zero lists set `removeClippedSubviews/maxToRenderPerBatch/windowSize` (AGENTS.md §8 violation); only `FileListItem` + `QueueItemRow` are `memo`.
- **Touch targets <44pt:** FilterChip (~30), icon buttons 36–38, tune 32, close/X 28, checkbox 20, delete 28, breadcrumbs 2py, modal buttons ~38. Compliant: `PillButton` md/lg (46/52), FAB 56, keypad 48, dialog 44, rows 60.
- **Dead UI:** `TelemetryBadge` near-unused (`neutral` variant dead), `TopHeader.showEnclaveBadge` never rendered, `apiCreds` fetched never shown, folder-breadcrumb `id===null` branch unreachable (`'root'` used), `sizeMB '2.40'` fallback + always-on "Confidential" pill in file details.
- **Light-mode leaks:** hardcoded `rgba(255,255,255,.08)`, `#2e2e2e`, `#222`, `#000` check in sort/folder/preview sheets.
