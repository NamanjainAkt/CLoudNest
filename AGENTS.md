# AGENTS.md — CloudNest Engineering & Architecture Handbook

> **Project:** CloudNest (v1.0)  
> **Platform:** React Native (Expo Dev Client) • Cross-Platform (iOS & Android)  
> **Core Engine:** Telegram MTProto • SQLite • Expo FileSystem • AES-256-GCM  
> **Design Paradigm:** Dual-Mode Precision (Obsidian Dark / Institutional Light) via Stitch Design System  
> **Document Role:** Primary architectural, design token, and implementation guideline for all AI agents and engineers.

---

## 1. Executive Summary & Product Vision

CloudNest is a **serverless, offline-first personal cloud storage application** that delivers an Apple Files / Google Drive experience without running custom backend servers or incurring recurring cloud storage fees.

### Core Architecture
- **Storage Engine:** Telegram MTProto API. Encrypted file blobs are sharded and stored within the user's private, dedicated Telegram storage channel. The user never interacts with the Telegram client UI; Telegram acts strictly as the invisible, high-capacity object storage network.
- **Local Virtual File System (VFS):** Powered by **Expo SQLite** for lightning-fast sub-50ms directory tree traversal, nested folder resolution, file tagging, search indexing, and metadata management.
- **Offline Cache:** Powered by **Expo FileSystem** and an in-memory LRU cache with automatic cache eviction and background sync.
- **Zero-Knowledge Cryptography:** Client-side AES-256-GCM authenticated encryption. Keys are derived via PBKDF2-HMAC-SHA512 and stored exclusively in **Expo SecureStore** (iOS Keychain / Android Keystore). Telegram servers only ever receive encrypted ciphertext blobs.

---

## 2. Agent Roles & Multi-Agent Delegation Matrix

Every task in the CloudNest lifecycle is assigned to specialized agents with strict responsibilities:

| Agent | Scope & Domain | Skills Applied | Forbidden Actions |
|---|---|---|---|
| `@[mobile-developer]` | **Primary Lead:** React Native & Expo UI, Navigation, Component architecture, Haptics, Gestures, Native bridges | `clean-code`, `mobile-design` | No `ScrollView` for lists; no unmemoized list items; no non-native animated styles |
| `@[project-planner]` | Architectural breakdown, task sequencing, milestone gatekeeping, verification checklists | `plan-writing`, `brainstorming` | No code writing during planning phase; ensure measurable verify criteria |
| `@[database-architect]` | Expo SQLite schema design, index optimization, VFS path lookups, transaction safety | `database-design`, `clean-code` | No blocking queries on JS thread; use prepared statements & transactions |
| `@[security-auditor]` | AES-256-GCM encryption pipeline, PBKDF2 key derivation, SecureStore session storage, MTProto handshake safety | `vulnerability-scanner`, `clean-code` | No plaintext credentials in `AsyncStorage`; no logging of keys or phone numbers |
| `@[test-engineer]` | Unit tests for crypto/VFS, mock MTProto client tests, E2E flows | `testing-patterns`, `tdd-workflow` | Do not mark tests passing without execution |

---

## 3. Stitch Design System & Dual-Mode Token Architecture

All UI components across CloudNest **MUST STRICTLY** replicate the Stitch design specifications located in `stitch_cloudnest_ui_design_system/`.

### 3.1 Color Palette & Semantic Tokens

The design system maintains strict dual-mode tokens. **No purple or uncalibrated violet tones are permitted.**

```typescript
// theme/tokens.ts
export const ColorTokens = {
  dark: {
    // Canvas & Surfaces
    surface: '#12131a',
    surfaceDim: '#12131a',
    surfaceBright: '#383941',
    surfaceContainerLowest: '#0d0e15',
    surfaceContainerLow: '#1a1b22',
    surfaceContainer: '#1e1f26',
    surfaceContainerHigh: '#292931',
    surfaceContainerHighest: '#33343c',
    
    // Content & Typography
    onSurface: '#e3e1ec',
    onSurfaceVariant: '#c2c6d6',
    inverseSurface: '#e3e1ec',
    inverseOnSurface: '#2f3038',
    
    // Hairline & Structural Borders
    outline: '#8c909f',
    outlineVariant: '#424754',
    borderSubtle: '#222222',
    borderStrong: '#2e2e2e',
    
    // Primaries (Electric Blue / Cloud Accent)
    primary: '#adc6ff',
    onPrimary: '#002e6a',
    primaryContainer: '#4d8eff',
    onPrimaryContainer: '#00285d',
    primaryFixed: '#d8e2ff',
    primaryFixedDim: '#adc6ff',
    onPrimaryFixed: '#001a42',
    onPrimaryFixedVariant: '#004395',
    
    // Secondaries & Enclave Nodes
    secondary: '#adc6ff',
    onSecondary: '#002e69',
    secondaryContainer: '#4b8eff',
    onSecondaryContainer: '#00285c',
    secondaryFixed: '#d8e2ff',
    secondaryFixedDim: '#adc6ff',
    onSecondaryFixed: '#001a41',
    onSecondaryFixedVariant: '#004493',
    
    // Tertiaries (Warm Amber / Cryptographic Key Indicator)
    tertiary: '#ffb786',
    onTertiary: '#502400',
    tertiaryContainer: '#df7412',
    onTertiaryContainer: '#461f00',
    tertiaryFixed: '#ffdcc6',
    tertiaryFixedDim: '#ffb786',
    onTertiaryFixed: '#311400',
    onTertiaryFixedVariant: '#723600',
    
    // Errors & Destruction
    error: '#ffb4ab',
    onError: '#690005',
    errorContainer: '#93000a',
    onErrorContainer: '#ffdad6',
    
    // Ambient Glow & Shadows
    glowPrimary: 'rgba(77, 142, 255, 0.45)',
    glowSecondary: 'rgba(173, 198, 255, 0.8)',
    shadowCard: 'rgba(0, 0, 0, 0.4)',
  },
  light: {
    // Canvas & Surfaces (Apple HIG Clean Institutional)
    surface: '#F2F2F7',
    surfaceDim: '#E5E5EA',
    surfaceBright: '#FFFFFF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F8F9FA',
    surfaceContainer: '#FFFFFF',
    surfaceContainerHigh: '#EFEFF4',
    surfaceContainerHighest: '#E5E5EA',
    
    // Content & Typography
    onSurface: '#000000',
    onSurfaceVariant: '#6C6C70',
    inverseSurface: '#1C1C1E',
    inverseOnSurface: '#F2F2F7',
    
    // Hairline & Structural Borders
    outline: '#8E8E93',
    outlineVariant: '#C7C7CC',
    borderSubtle: '#E5E5EA',
    borderStrong: '#D1D1D6',
    
    // Primaries
    primary: '#007AFF',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D0E2FF',
    onPrimaryContainer: '#002D6B',
    primaryFixed: '#E0EAFF',
    primaryFixedDim: '#B9D1FF',
    onPrimaryFixed: '#00183B',
    onPrimaryFixedVariant: '#003E99',
    
    // Secondaries
    secondary: '#34C759', // Verified sync state
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D1F2D9',
    onSecondaryContainer: '#083B14',
    secondaryFixed: '#E1F8E7',
    secondaryFixedDim: '#B7ECC3',
    onSecondaryFixed: '#04210A',
    onSecondaryFixedVariant: '#0E5C20',
    
    // Tertiaries (Warning / Key Indicator)
    tertiary: '#FF9500',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFE7CC',
    onTertiaryContainer: '#542D00',
    tertiaryFixed: '#FFF0E0',
    tertiaryFixedDim: '#FFD4A8',
    onTertiaryFixed: '#331B00',
    onTertiaryFixedVariant: '#7A4100',
    
    // Errors & Destruction
    error: '#FF3B30',
    onError: '#FFFFFF',
    errorContainer: '#FFD5D2',
    onErrorContainer: '#690005',
    
    // Ambient Glow & Shadows
    glowPrimary: 'rgba(0, 122, 255, 0.25)',
    glowSecondary: 'rgba(52, 199, 89, 0.3)',
    shadowCard: 'rgba(0, 0, 0, 0.06)',
  },
};
```

### 3.2 Typography Scale
Font families: **Inter** (Display, Headlines, Body, Labels) and **JetBrains Mono** (Technical, Hashes, Bytes, Chunk IDs).

| Style Name | Font Family | Size | Line Height | Letter Spacing | Weight | Usage |
|---|---|---|---|---|---|---|
| `display` | Inter | 48px | 52px | -0.03em | 600 | Giant storage hero (e.g. "23.4 GB") |
| `headline-lg` | Inter | 32px | 38px | -0.025em | 600 | Desktop/Tablet large headings |
| `headline-lg-mobile` | Inter | 26px | 32px | -0.02em | 600 | Mobile screen headings ("Good evening, Alex") |
| `headline-md` | Inter | 22px | 28px | -0.02em | 600 | Modal titles, screen headlines |
| `headline-sm` | Inter | 17px | 22px | -0.015em | 600 | Section headers, card titles, app bar titles |
| `body-lg` | Inter | 15px | 22px | -0.01em | 400 | Primary file titles in rows/cards |
| `body-md` | Inter | 13px | 18px | -0.005em | 400 | Subtext, descriptions, form help |
| `body-sm` | Inter | 12px | 16px | 0em | 400 | Fine print, metadata summaries |
| `label-md` | Inter | 13px | 16px | -0.005em | 500 | Button labels, filter pill active labels |
| `label-sm` | Inter | 11px | 14px | +0.01em | 500 | Badges, category indicators, uppercase tags |
| `mono-sm` | JetBrains Mono | 11px | 14px | 0em | 400 | Key hashes, chunk IDs, byte counters, speed indicators |

### 3.3 Radii & Elevation Hierarchy
- **Capsule / Pill (`rounded-full` / `9999px`):** Buttons, interactive filter pills, search input bar, FAB, telemetry badges.
- **Cards & Panels (`rounded-DEFAULT` / `16px`):** File preview cards, storage hero container, bottom sheet modal header, settings sections.
- **List Rows (`rounded-md` / `12px`):** File items, recent searches, queue rows.
- **Hairline Borders:** `1px` width using `borderSubtle` (`#222222` dark / `#E5E5EA` light).

---

## 4. Complete Screen Catalog (Stitch Design Specification)

Every screen has a 1-to-1 counterpart in `stitch_cloudnest_ui_design_system/`. Agents must strictly follow these structural and behavioral blueprints:

### Screen 1: Splash & Onboarding (`cloudnest_splash_onboarding` & `cloudnest_brand_mark`)
- **Brand Mark:** SVG vector logo with `#0A0A0A` background, `#3B82F6`->`#1D4ED8` cloud gradient, white arrow up glyph.
- **Onboarding Carousel (3 Slides):**
  1. *Unlimited Personal Cloud:* Concentric quantum storage rings SVG, RAW 0-EXP & P2P NODE badges.
  2. *Offline First Architecture:* Synchronized local cache nodes with offline file blocks, 100% available indicator.
  3. *Encrypted by Default:* AES-GCM 256 vault shield & Zero-Knowledge verified cryptographic mesh.
- **Controls:** Top bar with `CloudNest v2.4` pill and `Skip` button; bottom carousel indicator dots and pill `Get Started` button.

### Screen 2: Sign In with Telegram (`cloudnest_sign_in_with_telegram`)
- **Header:** Back button, "Sign In" title, person avatar pill.
- **Center Stage:** Cloud shield & Telegram telemetry node emblem with glowing cyan satellite lock.
- **Phone Input:** Country flag + code selector (`🇺🇸 +1`), hairline divider, large formatted phone input (`555 019 2834`), live validation status glyph (`phonelink_ring`).
- **Cards:** Protocol assurance banner ("We will send a one-time login code to your Telegram app"), Zero-Knowledge client guarantee card explaining local AES-256 chunking.
- **CTA:** Full pill `Continue` button with arrow icon.

### Screen 3: OTP Verification (`cloudnest_otp_verification`)
- **Header:** "Zero-Knowledge Handshake" lock pill, "Enter Verification Code" headline, target phone number with "Edit" trigger.
- **OTP Input:** 6 discrete rounded slots with dark container fill, active slot featuring a blinking cyan cursor bar (`animate-pulse`).
- **Telemetry:** "Listening for session grant on Telegram desktop..." status.
- **Actions:** Resend countdown timer pill (`0:42`), SMS fallback button, tactile numeric keypad simulator.
- **CTA:** `Verify & Unlock Vault` primary pill button.

### Screen 4: Creating Vault (`cloudnest_creating_vault`)
- **Visual:** Concentric orbital cryptographic key visualizer SVG with outer/middle/inner spinning particle rings.
- **Entropy Telemetry:** `AES-256-GCM · PBKDF2-HMAC-SHA512` status pill.
- **Progress Track:** 4-phase segmented bar (`75%` progress).
- **Checklist:**
  - *Step 1:* Generating 256-bit master key (Done - checkmark).
  - *Step 2:* Initializing zero-knowledge container (Done - checkmark).
  - *Step 3:* Allocating encrypted telegram chunks (Active - spinning sync glyph).
  - *Step 4:* Finalizing local SQLite database & folder structure.

### Screen 5: Home Dashboard (`cloudnest_home_dashboard`)
- **Header:** Brand mark, "CloudNest" title + verified shield, `TG-ENCLAVE` pulsing green badge, user profile button.
- **Greeting:** "Good evening, Alex" + "Vault synced via Telegram E2EE • 42 ms ping" status.
- **Hero Storage Telemetry Card:**
  - "23.4 GB of unlimited Telegram Cloud" headline in `display` 34px typography.
  - 3-segment progress meter bar: Media (63% - Primary), Docs (26% - Secondary), Archives (11% - Tertiary).
  - "Manage Storage" arrow link.
- **Quick Access Categories Carousel:** Horizontal scrollable pills: Documents (84), Media & Photos (412), Code & Archives (29), Audio Notes (18).
- **Recent Files Carousel:** Horizontal cards showing file type icons, E2EE lock pill, file size, relative sync time ("Synced 12m ago").
- **Folders Grid:** 2-column bento grid for folders: Personal Vault, Design Projects, Legal & Tax, Saved Media (with item count & GB used).
- **Persistent FAB:** Bottom-right floating action button (`#4d8eff` glow) with micro-interaction rotation.
- **Bottom Navigation Bar:** 4 tabs: `Home`, `Search`, `Uploads` (with active upload badge `2`), `Settings`.

### Screen 6: Folder Browser / Hierarchy Navigator (`cloudnest_folder_browser`)
- **Subheader:** Back button, folder title ("Personal Vault"), search button, view toggle (Grid / List), filter tune button.
- **Breadcrumb Path Bar:** `Vault > Personal > Confidential` with interactive navigation.
- **Telemetry Strip:** "142 files • 8.4 GB", "Fully encrypted with AES-256-GCM • Synced to Telegram Chunks".
- **Filter Pills:** Segmented pills: All (142), Documents (48), Images (64), Encrypted (30).
- **High-Density File List:** File icon with locked badge, title, metadata ("2.4 MB • Modified Today • Telegram Chunk #184"), client-side verified shield, more options button.

### Screen 7: Upload Bottom Sheet (`cloudnest_upload_bottom_sheet`)
- **Backdrop:** Translucent dark backdrop mask (`rgba(13, 14, 21, 0.8)`).
- **Sheet:** Grabber handle, rounded top corners (`28px`).
- **Options Bento Grid:**
  - `Upload File` (System document picker)
  - `Camera` (Instant photo/document capture)
  - `Photo Library` (Media gallery picker)
  - `New Folder` (Virtual folder creator modal)
- **Security Footer:** "Zero-Knowledge Encryption Active — All files encrypted with AES-256 before transmission".

### Screen 8: Uploads Queue & Activity (`cloudnest_uploads_queue`)
- **Header:** "CloudNest Uploads Queue", upload speed (`4.2 MB/s • Encrypting`), "Pause All" button.
- **Filter Pills:** All (6), Active (2), Completed (3), Failed (1).
- **Queue Cards:**
  - File icon, file title, transfer progress ("342 MB of 1.2 GB • 68% • 14s remaining").
  - Glowing head progress bar with cyan flare.
  - Chunk telemetry: "Chunk 18/60 synced • 5.2 MB/s".
  - Action buttons: Pause and Cancel per upload.
  - Failed items provide "Retry" action.

### Screen 9: File Details & Inspector (`cloudnest_file_details`)
- **Top Actions:** Path pill (`vault://personal/confidential`), Favorite star toggle, more options.
- **Document Preview Container:** Simulated document preview with "AES-256-GCM In-Memory" badge, confidential status pill, watermarked preview card, and floating bottom page controller (Page 1 of 4, Zoom In/Out).
- **File Metadata Bento:** Size (14.2 MB), Type (PDF), Modified date, Telegram Message ID, Chunk Hash.
- **Cryptographic Action Bar:** Action pills for `Download / Decrypt`, `Move`, `Rename`, `Delete`.

### Screen 10: Search & Smart Filter (`cloudnest_search`)
- **Search Hero:** Pill input with magnifying glass, clear button, filter drawer toggle.
- **Telemetry Badge:** "Zero-Knowledge Index • Local in-memory RAM".
- **Horizontal Filter Chips:** All, Documents, Images, Archives, Media, By Date, Tags.
- **Recent Searches:** Dismissable chip history ("passport scan", "quarterly_budget.xlsx").
- **Live Search Results:** Real-time SQLite full-text search matches highlighted.

### Screen 11: Settings & Enclave (`cloudnest_settings`)
- **Header:** "Settings", "v2.4-e2ee" pill, "ENCLAVE SECURE" pulsing indicator.
- **Telegram Identity Section:** User profile avatar, name ("Alex Chen"), handle ("@alex_cryptodev"), phone number, connection status ("Connected via MTProto"), hardware session enclave ("Frankfurt DC4 • Key Hash: 0x9F4C..."), Sign Out button.
- **Storage & Network Section:** Telegram Cloud Quota meter, Cache Size manager with "Clear Offline Cache" trigger.
- **Security & Privacy Section:** App PIN Lock toggle, Biometrics (Face ID / Fingerprint) toggle, Master Key Export / Backup Seed Phrase.
- **About Section:** Build version, Open Source licenses, E2EE whitepaper link.

### Screen 12: Trash & Retention (`cloudnest_trash`)
- **Header:** "Empty Trash" destructive action button.
- **Policy Banner:** "Retention Window Policy — Items are automatically and permanently purged after 30 days."
- **Telemetry:** "14 items in purge queue • 1.84 GB occupied".
- **Controls:** Sort by deletion date, Select All toggle.
- **Deleted Items List:** Checkbox, file icon, filename, deleted date, days remaining ("Expires in 28 days"), inline `Restore` and `Delete Forever` actions.

---

## 5. Technical Architecture & File Layout

### 5.1 Project Directory Structure

```text
teleStore/
├── app/                           # Expo Router / Navigation Routes
│   ├── (auth)/
│   │   ├── onboarding.tsx         # Screen 1: Splash & Onboarding
│   │   ├── sign-in.tsx            # Screen 2: Telegram Phone Auth
│   │   ├── otp-verify.tsx         # Screen 3: OTP Verification
│   │   └── create-vault.tsx       # Screen 4: Vault Initialization
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Bottom Tab Bar Shell
│   │   ├── index.tsx              # Screen 5: Home Dashboard
│   │   ├── search.tsx             # Screen 10: Search Screen
│   │   ├── uploads.tsx            # Screen 8: Uploads Queue
│   │   └── settings.tsx           # Screen 11: Settings Screen
│   ├── folder/
│   │   └── [folderId].tsx         # Screen 6: Folder Browser
│   ├── file/
│   │   └── [fileId].tsx           # Screen 9: File Details & Preview
│   ├── trash.tsx                  # Screen 12: Trash Screen
│   └── _layout.tsx                # Root Theme & Security Enclave Provider
├── components/                    # Reusable Stitch-Compliant UI Components
│   ├── common/
│   │   ├── BrandMark.tsx          # SVG Brand Icon
│   │   ├── Button.tsx             # Pill Buttons (Primary, Outline, Ghost)
│   │   ├── FilterChip.tsx         # Filter & Category Pills
│   │   ├── ProgressBar.tsx        # Segmented & Glowing Progress Bars
│   │   ├── TelemetryBadge.tsx     # E2EE, Enclave & Speed Badges
│   │   └── TopHeader.tsx          # Consistent Blur App Header
│   ├── dashboard/
│   │   ├── StorageMeterCard.tsx   # Hero Storage Bento Card
│   │   ├── RecentFilesList.tsx    # Horizontal Recents Carousel
│   │   └── FolderGrid.tsx         # 2-Column Bento Folder Grid
│   ├── file-manager/
│   │   ├── FileListItem.tsx       # Memoized High-Density Row
│   │   ├── FileGridItem.tsx       # Grid Preview Card
│   │   ├── BreadcrumbBar.tsx      # Interactive Directory Breadcrumbs
│   │   └── UploadBottomSheet.tsx  # Screen 7: Bottom Sheet Modal
│   └── queue/
│       └── QueueItemRow.tsx       # Upload Progress Row with Controls
├── theme/                         # Central Design System Engine
│   ├── colors.ts                  # Light & Dark Color Palettes
│   ├── typography.ts              # Inter & JetBrains Mono Scales
│   ├── spacing.ts                 # Paddings, Margins & Gutters
│   ├── shadows.ts                 # Calibrated Subtle Shadows
│   └── ThemeContext.tsx           # Dual-Mode Provider & Hook
├── services/                      # Core Business Logic & Infrastructure
│   ├── db/
│   │   ├── schema.ts              # SQLite Schema Definitions
│   │   ├── dbClient.ts            # Expo SQLite Connection
│   │   ├── filesDao.ts            # File CRUD Operations
│   │   └── foldersDao.ts          # Folder CRUD Operations
│   ├── crypto/
│   │   ├── cipher.ts              # AES-256-GCM Encrypt/Decrypt
│   │   ├── keyDerivation.ts       # PBKDF2 Master Key Setup
│   │   └── secureStore.ts         # Secure Key Storage (Keychain/Keystore)
│   ├── telegram/
│   │   ├── mtprotoClient.ts       # Telegram API Client Wrapper
│   │   ├── authService.ts         # Phone OTP & Session Management
│   │   ├── channelService.ts      # Private Vault Channel Creation
│   │   └── uploadService.ts       # File Sharding & Transmission
│   ├── sync/
│   │   ├── uploadQueueManager.ts  # Background Upload Coordinator
│   │   └── cacheManager.ts        # Expo FileSystem LRU Cache
│   └── types/
│       └── models.ts              # TypeScript Interfaces
├── assets/                        # Fonts, Icons & Static Images
├── package.json
└── app.json
```

---

## 6. SQLite Database Schema (Virtual File System)

CloudNest stores all filesystem metadata locally in **Expo SQLite**:

```sql
-- Folders Table
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY NOT NULL,
    parent_id TEXT, -- NULL for root
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Files Table
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY NOT NULL,
    folder_id TEXT, -- NULL for root
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    extension TEXT NOT NULL,
    telegram_message_id INTEGER,
    telegram_channel_id TEXT NOT NULL,
    is_encrypted INTEGER DEFAULT 1,
    encryption_iv TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    local_cache_path TEXT,
    is_favorite INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Upload Queue Table
CREATE TABLE IF NOT EXISTS upload_queue (
    id TEXT PRIMARY KEY NOT NULL,
    file_path TEXT NOT NULL,
    target_folder_id TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending' | 'encrypting' | 'uploading' | 'completed' | 'failed' | 'paused'
    progress REAL DEFAULT 0.0,
    current_chunk INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 1,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- App Settings & Telemetry Key-Value Store
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(is_deleted, deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_favorite ON files(is_favorite, is_deleted);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_upload_queue_status ON upload_queue(status);
```

---

## 7. Cryptographic & File Pipeline Specifications

```text
[Local File] 
     │
     ▼
[Read via Expo FileSystem into ArrayBuffer]
     │
     ▼
[Derive AES-256-GCM Key from Master Seed in SecureStore]
     │
     ▼
[Generate 12-byte cryptographically secure random IV]
     │
     ▼
[Encrypt File Buffer -> Ciphertext Blob + Auth Tag]
     │
     ▼
[If > 10MB: Shard into Telegram 2MB–10MB MTProto Document Chunks]
     │
     ▼
[Transmit to Private Telegram Storage Channel via MTProto]
     │
     ▼
[Receive Telegram Message ID(s)]
     │
     ▼
[Write Metadata (Message IDs, IV, Size, SHA256) into SQLite]
     │
     ▼
[Cache decrypted copy locally in FileSystem.cacheDirectory for instant viewing]
```

---

## 8. Mobile Performance & Quality Rules (Non-Negotiable)

1. **FlatList Optimization:**
   - Every file list, search list, queue list, and category feed must use `FlatList` with `removeClippedSubviews={true}`, `maxToRenderPerBatch={10}`, `windowSize={5}`, and a stable `keyExtractor={(item) => item.id}`.
   - All list item components must be wrapped in `React.memo` with memoized callbacks (`useCallback`) for row interactions.
2. **Touch Targets & Safe Areas:**
   - Minimum interactive touch bounds: **44pt (iOS) / 48dp (Android)**.
   - Use `SafeAreaView` / `useSafeAreaInsets()` for top status bar and bottom home-indicator clearances.
   - Primary action buttons placed in the thumb zone (lower third of the screen).
3. **No Sensitive Data in Plain Storage:**
   - Session keys, Telegram tokens, and encryption salts **MUST** live exclusively in `Expo SecureStore`.
   - Never log session tokens or plaintext payloads to the console.
4. **Offline Resilience:**
   - File metadata, directory trees, search index, and cached files must work 100% when device is in Airplane Mode.
   - When network recovers, `uploadQueueManager` resumes pending tasks automatically with exponential backoff.
5. **Strict Purple Ban:**
   - Follow the Stitch design tokens. Primary accent is electric blue (`#adc6ff` / `#4d8eff` dark, `#007AFF` light) on an obsidian canvas (`#12131a`).

---

## 9. Implementation Roadmap & Milestones

- [x] **Milestone 1 — Foundation & Design System:**
  - Setup Expo project, TypeScript, and custom style engine with `ThemeContext` supporting Dark (`#12131a`) and Light (`#F2F2F7`) mode tokens.
  - Implement reusable Stitch components: Buttons, Chips, Badges, Headers, Progress Bars, BrandMark SVG.
- [x] **Milestone 2 — Database & Storage Engine:**
  - Initialize Expo SQLite database and run migration scripts (`services/db/schema.ts`, `services/db/dbClient.ts`).
  - Implement DAO layer for files, folders, and settings with pre-seeded mock directories.
  - Setup Expo SecureStore and AES-256-GCM encryption utilities (`services/crypto/`).
- [x] **Milestone 3 — Auth & Vault Creation:**
  - Build Screen 1 (Onboarding Carousel), Screen 2 (Phone Login with India `+91` default & Country Picker Modal), Screen 3 (OTP Verification), and Screen 4 (Creating Vault animation).
  - Setup MTProto client handshake and private channel initialization targeting Frankfurt DC4.
- [x] **Milestone 4 — Core Screens & Navigation:**
  - Build Tab Bar shell and Screen 5 (Home Dashboard with Storage Card, Recents, Folders).
  - Build Screen 6 (Folder Browser with breadcrumbs and file rows).
  - Build Screen 7 (Upload Bottom Sheet modal with document and image pickers).
- [x] **Milestone 5 — Upload Pipeline & Queue:**
  - Build Screen 8 (Uploads Queue with live speeds, chunk tracking, pause/cancel).
  - Build background upload sync worker and LRU cache manager.
- [x] **Milestone 6 — Search, Details, Settings & Trash:**
  - Build Screen 10 (Fast Search with category filter chips).
  - Build Screen 9 (File Inspector with document preview and key fingerprint).
  - Build Screen 11 (Settings with session enclave, ping telemetry, and dark mode toggle).
  - Build Screen 12 (Trash with 30-day retention and restore).
- [x] **Milestone 7 — Verification & Polish:**
  - Touch target audit, 60fps scrolling verification, dark/light contrast audit, unit tests (19/19 passing), and Expo doctor (21/21 passing).

---

## 10. Production Roadmap ("What's Left")

Detailed specifications and architectural deep dives are documented in [WIKI.md](file:///C:/Andy%20projects/teleStore/WIKI.md):
1. **Real MTProto Socket Transport:** Production GramJS / TDLib socket wrapper with registered Telegram App ID / API Hash.
2. **True File Stream Chunking:** Slicing >10MB files into 512KB-2MB byte parts and calling `upload.saveBigFilePart` Telegram RPCs.
3. **In-App Media Streaming & Decryption Cache:** Chunked video/audio stream playback without full-file memory buffering.
4. **Biometric Enclave:** `expo-local-authentication` (FaceID / Fingerprint) app lock & auto-lock timeout.
5. **Background Sync Worker:** `expo-task-manager` / `expo-background-fetch` for background queue persistence.
6. **EAS Production Store Builds:** App Store `.ipa` & Play Store `.aab` signing and release packaging.

