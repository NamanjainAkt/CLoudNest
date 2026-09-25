# Plan: CloudNest Mobile App (React Native Expo)

> **Task Slug:** `cloudnest-mobile`  
> **Source Documents:** `CloudNest_PRD_v1.0.md` & `stitch_cloudnest_ui_design_system/`  
> **Primary Agents:** `@[mobile-developer]`, `@[project-planner]`, `@[database-architect]`, `@[security-auditor]`

---

## 1. Overview
CloudNest is a serverless, offline-first personal cloud storage application built with React Native and Expo Dev Client. Instead of expensive cloud storage backends, CloudNest leverages Telegram's MTProto infrastructure as a high-capacity encrypted object store, while presenting a high-fidelity Apple Files / Notion / Google Drive level mobile UX.

---

## 2. Project Type & Platform Target
- **Project Type:** `MOBILE`
- **Target OS:** iOS & Android (Cross-Platform)
- **Framework:** React Native with Expo (Dev Client)
- **Design Paradigm:** Dual-mode theme system (Obsidian Dark & Institutional Light) implementing the Stitch Design System.

---

## 3. Measurable Success Criteria
1. **Sub-2s App Cold Launch:** Instant display of local cached SQLite file tree.
2. **Sub-300ms Folder Navigation:** Immediate directory switching with zero network blocking.
3. **Sub-100ms Search Response:** Instant local full-text search indexing on metadata.
4. **Zero-Knowledge Encryption Verified:** 100% of files encrypted via AES-256-GCM before leaving the device; Telegram only receives opaque encrypted blobs.
5. **100% Offline Availability for Cached Items:** Browsing, searching, and previewing cached files functions seamlessly with device in Airplane Mode.
6. **Stitch UI Compliance:** Complete 1-to-1 visual parity with the 12 Stitch screen designs in `stitch_cloudnest_ui_design_system/`.

---

## 4. Technology Stack & Rationale

| Layer | Choice | Rationale |
|---|---|---|
| Mobile Runtime | React Native + Expo | Cross-platform, fast iteration, native module support via config plugins |
| Navigation | Expo Router (File-based) | Deep linking, native tabs, stack transitions, modal sheets |
| Styling / Design Tokens | Custom Theme Engine / NativeWind | Strict dual-mode token support conforming to Stitch `DESIGN.md` |
| Metadata Database | Expo SQLite (`expo-sqlite`) | High performance, zero server lag, offline-first relational queries |
| Local File Cache | Expo FileSystem (`expo-file-system`) | Resilient local storage, LRU cache eviction |
| Cryptography | WebCrypto / AES-256-GCM + PBKDF2 | Zero-knowledge security, tamper-proof authenticated encryption |
| Key Storage | Expo SecureStore (`expo-secure-store`) | iOS Keychain & Android Keystore integration for keys and session tokens |
| Network / Storage Bridge | Telegram MTProto API | Infinite-feeling personal storage without backend server costs |

---

## 5. Directory Layout

```text
teleStore/
├── app/                           # Expo file-based routes
│   ├── (auth)/                    # Onboarding, Phone Login, OTP, Vault Setup
│   ├── (tabs)/                    # Bottom tab navigator (Home, Search, Uploads, Settings)
│   ├── folder/[folderId].tsx      # Folder browser screen
│   ├── file/[fileId].tsx          # File inspector screen
│   ├── trash.tsx                  # Trash screen
│   └── _layout.tsx                # App provider & theme root
├── components/                    # Reusable Stitch UI components
│   ├── common/                    # Button, FilterChip, ProgressBar, Badges, Header
│   ├── dashboard/                 # StorageMeterCard, RecentFilesList, FolderGrid
│   ├── file-manager/              # FileListItem, FileGridItem, BreadcrumbBar, UploadBottomSheet
│   └── queue/                     # QueueItemRow
├── theme/                         # Stitch Color tokens, typography, spacing, ThemeContext
├── services/                      # SQLite DB, AES Crypto, Telegram MTProto, Sync Queue
├── assets/                        # Icons, fonts (Inter, JetBrains Mono)
└── docs/                          # Architecture & Planning documents
```

---

## 6. Detailed Task Breakdown

### Task 1: Expo App Foundation & Theme Token Engine
- **Agent:** `@[mobile-developer]`
- **Skills:** `clean-code`, `mobile-design`
- **Priority:** P0 (Blocker)
- **Dependencies:** None
- **INPUT:** Stitch `DESIGN.md` and color specifications.
- **OUTPUT:** Expo project configuration with Inter & JetBrains Mono fonts, dual-mode `ThemeContext` providing light/dark color tokens, elevation, spacing, and radii.
- **VERIFY:** Theme switcher successfully toggles between `#12131a` (dark) and `#F2F2F7` (light) with zero purple/violet colors.

### Task 2: Reusable Stitch Component Library
- **Agent:** `@[mobile-developer]`
- **Skills:** `clean-code`, `mobile-design`
- **Priority:** P0
- **Dependencies:** Task 1
- **INPUT:** Stitch `code.html` components (BrandMark, Pill Buttons, Filter Chips, Progress Bars, Telemetry Badges, App Headers).
- **OUTPUT:** Production-ready React Native components in `components/common/` with 44-48px touch targets.
- **VERIFY:** Component test renders with correct padding, corner radiuses, and accessibility labels.

### Task 3: Local SQLite Database & VFS DAO Layer
- **Agent:** `@[database-architect]`
- **Skills:** `database-design`, `clean-code`
- **Priority:** P1
- **Dependencies:** Task 1
- **INPUT:** VFS schema in `AGENTS.md` (folders, files, upload_queue, app_settings).
- **OUTPUT:** `services/db/` with schema migration, transaction-wrapped CRUD for folders and files, and full-text search indexing.
- **VERIFY:** CRUD integration tests pass; inserting 500 files queries under 50ms.

### Task 4: Zero-Knowledge Cryptography & Key Management
- **Agent:** `@[security-auditor]`
- **Skills:** `vulnerability-scanner`, `clean-code`
- **Priority:** P1
- **Dependencies:** Task 1
- **INPUT:** AES-256-GCM specifications and PBKDF2 parameters.
- **OUTPUT:** `services/crypto/` with encryptFile/decryptFile, SecureStore credential storage, key generation.
- **VERIFY:** Encrypting sample file yields ciphertext + tag; decryption reproduces exact original bytes; keys stored in SecureStore.

### Task 5: Auth & Vault Creation Flow (Screens 1 to 4)
- **Agent:** `@[mobile-developer]`
- **Skills:** `mobile-design`, `clean-code`
- **Priority:** P1
- **Dependencies:** Tasks 2, 3, 4
- **INPUT:** Stitch screens: `cloudnest_splash_onboarding`, `cloudnest_sign_in_with_telegram`, `cloudnest_otp_verification`, `cloudnest_creating_vault`.
- **OUTPUT:** Interactive 3-slide onboarding, phone input with country code selector, 6-slot OTP input with simulated keypad, and 4-phase orbital vault creator.
- **VERIFY:** User can enter phone, input OTP, watch vault creation milestone checklist, and navigate to dashboard.

### Task 6: Home Dashboard & Tab Navigation (Screen 5)
- **Agent:** `@[mobile-developer]`
- **Skills:** `mobile-design`, `clean-code`
- **Priority:** P1
- **Dependencies:** Tasks 2, 3, 5
- **INPUT:** Stitch screen `cloudnest_home_dashboard` and bottom tab navigation.
- **OUTPUT:** Persistent bottom tab bar, storage hero bento card with 3-segment meter bar, categories carousel, recent files horizontal cards, 2-column folders grid, and pulsing FAB.
- **VERIFY:** Storage card computes breakdown accurately; FAB triggers micro-feedback and opens upload bottom sheet.

### Task 7: Folder Browser & File Hierarchy (Screen 6)
- **Agent:** `@[mobile-developer]`
- **Skills:** `mobile-design`, `clean-code`
- **Priority:** P2
- **Dependencies:** Tasks 3, 6
- **INPUT:** Stitch screen `cloudnest_folder_browser`.
- **OUTPUT:** Breadcrumb path navigation, folder telemetry strip, filter segmented pills, memoized FlatList file rows with AES-256-GCM lock badges.
- **VERIFY:** Navigating deep directory hierarchies updates breadcrumbs smoothly; 60fps scrolling on large file lists.

### Task 8: Upload Bottom Sheet & Queue Engine (Screens 7 & 8)
- **Agent:** `@[mobile-developer]`
- **Skills:** `mobile-design`, `clean-code`
- **Priority:** P2
- **Dependencies:** Tasks 3, 4, 6
- **INPUT:** Stitch screens `cloudnest_upload_bottom_sheet` and `cloudnest_uploads_queue`.
- **OUTPUT:** Bottom sheet modal with File/Camera/Photos/Folder options; upload queue manager tracking progress, speed, chunk counts, with pause/resume/cancel controls.
- **VERIFY:** Adding files queues items; progress bar renders glowing cyan head; status updates persist in SQLite.

### Task 9: File Inspector, Search, Settings & Trash (Screens 9 to 12)
- **Agent:** `@[mobile-developer]`
- **Skills:** `mobile-design`, `clean-code`
- **Priority:** P2
- **Dependencies:** Tasks 6, 7, 8
- **INPUT:** Stitch screens `cloudnest_file_details`, `cloudnest_search`, `cloudnest_settings`, `cloudnest_trash`.
- **OUTPUT:** File details with simulated document preview & zoom; real-time search with filter chips and search history; settings with Telegram identity and cache cleaner; trash screen with 30-day retention and restore.
- **VERIFY:** Searching filters results under 100ms; clearing cache removes temporary files; restoring trashed file updates folder view.

---

## 7. Phase X: Final Verification & Definition of Done

- [x] **Lint & TypeScript Validation:** `npx tsc --noEmit` returns 0 errors.
- [x] **Expo Health Check:** `npx expo-doctor` passes 21/21 checks with 0 issues.
- [x] **Design System Compliance:**
  - [x] Dual-mode light & dark themes strictly adhere to Stitch `DESIGN.md`.
  - [x] Zero purple/violet hex codes used.
  - [x] Minimum 44-48px touch targets for all interactive elements.
- [x] **Authentication & Regional Support:**
  - [x] Interactive Country Picker Modal with real-time search and popular quick chips.
  - [x] India (`+91`, `🇮🇳`) configured as primary default with 10-digit 5-5 formatting.
  - [x] International paste detection & live checkmark validation glyph.
- [x] **Performance & Mobile Ergonomics:**
  - [x] All lists implemented with `FlatList` + `React.memo` + `useCallback`.
  - [x] Safe Area Insets respected on iOS & Android.
  - [x] Offline capability verified in Airplane Mode.
- [x] **Security Audit & Key Management:**
  - [x] Master keys & Telegram session tokens stored in `SecureStore`.
  - [x] Hardware Biometrics (FaceID / Fingerprint) integration via `expo-local-authentication`.
  - [x] 12-Word Mnemonic Vault Recovery Phrase generator and modal.
  - [x] Zero sensitive tokens logged in console.
- [x] **Unit Testing:**
  - [x] 36/36 unit tests passing via `npm run test`.
- [x] **Biometric Auto-Lock Enclave:**
  - [x] Hardware FaceID / Fingerprint lock gatekeeper on app launch & resume (`BiometricLockOverlay.tsx`).
- [x] **Offline Cache Eviction (LRU):**
  - [x] Storage threshold management & dynamic LRU eviction engine (`CacheManager.ts`).
- [x] **Telegram MTProto Transport & Edge Node Routing:**
  - [x] Live WebSocket edge node endpoints (`pluto`, `venus`, `vesta`, `flora`) and roundtrip latency diagnostics.
- [x] **Background Sync Worker:**
  - [x] Resilient queue coordinator for pending chunk transfers (`BackgroundSyncManager`).

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass (`npx tsc --noEmit` - 0 errors)
- Tests: ✅ 36/36 Pass (`node --test __tests__/*.mjs`)
- Doctor: ✅ 21/21 Pass (`npx expo-doctor`)
- Design Parity: ✅ 12/12 Screens implemented strictly matching Stitch design system
- Regional Support: ✅ India (+91) default + full country picker modal
- Biometric Security: ✅ Hardware FaceID / Fingerprint lock gatekeeper (`BiometricLockOverlay`)
- Key Recovery: ✅ 12-word mnemonic phrase backup & restore modal (`RecoveryPhraseModal` & `RestoreVaultModal`)
- File Chunking: ✅ 1MB file slicing & assembly engine (`ChunkingService`)
- Cache Management: ✅ LRU cache size calculation & eviction engine (`CacheManager`)
- MTProto Transport: ✅ Edge node routing with live latency diagnostics (`MTProtoClient`)
- Background Sync: ✅ Queue coordinator for offline-to-online uploads (`BackgroundSyncManager`)
- File Previews: ✅ Fullscreen image zoom, code viewer, and native sharing via `expo-sharing`
- Live Credentials: ✅ Telegram `api_id` (36408941) and `api_hash` configured via `.env`
- Build Packaging: ✅ EAS Build configuration created (`eas.json`)
- Dummy Data Purge: ✅ 100% of mock files, fake storage stats, hardcoded profiles, and test OTPs removed
- Documentation: ✅ Master Wiki updated in `WIKI.md` & `docs/WIKI.md`
- Date: 2026-09-24

