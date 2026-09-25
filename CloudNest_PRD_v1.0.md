# CloudNest PRD (v1.0)

**Serverless, Offline-First Cloud Drive Powered by Telegram**

> React Native (Expo Dev Client) • Telegram MTProto • SQLite • Expo FileSystem • AES-256

---

## 1. Product Vision

CloudNest is a personal cloud storage application that provides a Google Drive–like experience without requiring traditional backend infrastructure.

Instead of storing files on expensive cloud servers, CloudNest stores encrypted files inside the user's own private Telegram storage while presenting a polished file manager with offline sync, virtual folders, and premium UX.

**The user never interacts with Telegram directly. Telegram is simply the storage engine.**

---

## 2. Goals

### Primary Goals

- Zero backend infrastructure
- Offline-first experience
- Premium file manager UI
- Secure encrypted storage
- Unlimited-feeling personal cloud

### Non-Goals (MVP)

- Public file sharing
- Team collaboration
- Server-side AI
- Payment integration

---

## 3. Target Users

| User | Problem |
|------|---------|
| Students | Limited free cloud storage |
| Developers | Need unlimited backups |
| Creators | Store large media files |
| Professionals | Secure document vault |

---

## 4. Tech Stack

| Layer | Technology |
|--------|------------|
| Mobile | React Native |
| Framework | Expo Dev Client |
| Storage | Telegram MTProto |
| Local Database | Expo SQLite |
| Cache | Expo FileSystem |
| Encryption | AES-256 |
| Authentication | Telegram OTP |
| Build | EAS Build |

---

## 5. Architecture

```text
CloudNest App
    │
    ├── SQLite (metadata)
    ├── File Cache (offline)
    │
    ▼
Telegram MTProto
    ▼
Private Telegram Channel
```

---

## 6. Storage Model

Telegram stores messages.

CloudNest creates a virtual filesystem.

Example:

```text
CloudNest

├── Documents
│   ├── Resume.pdf
│   └── Offer.pdf
├── Images
│   └── Photo.jpg
└── Projects
    └── React.zip
```

SQLite stores metadata.

```json
{
  "id":"123",
  "name":"Resume.pdf",
  "parent":"documents",
  "telegramMessageId":5423,
  "size":129300,
  "encrypted":true
}
```

---

## 7. Core Features

### Authentication

- Phone number login
- Telegram OTP verification
- Persistent session
- Automatic login

### Automatic Vault Setup

First launch automatically:

- Creates private Telegram channel
- Saves Channel ID
- Initializes local database
- Creates default folders

### Upload Files

Supported:

- Images
- Videos
- PDFs
- ZIP
- Audio
- Documents

Flow:

```text
Pick File
    ↓
Encrypt
    ↓
Queue
    ↓
Upload
    ↓
Save Message ID
    ↓
Update SQLite
```

### File Manager

Features:

- Grid view
- List view
- Search
- Sort
- Move
- Rename
- Delete
- Favorites
- Recent files

### Offline Mode

Available offline:

- Folder structure
- File metadata
- Cached files
- Pending uploads

### Search

Search by:

- Name
- File type
- Folder
- Date

Powered by SQLite.

### File Preview

| File | Preview |
|------|---------|
| Images | Yes |
| PDFs | Yes |
| Videos | Stream |
| Audio | Player |
| ZIP | Info only |

### Upload Queue

States:

- Uploading
- Waiting
- Failed
- Completed

Users can retry failed uploads.

### Trash

Deleted files:

- Move to Trash
- Restore
- Permanently delete
- Auto-delete after 30 days

---

## 8. Future Features

### Security

- PIN lock
- Face ID
- Fingerprint

### Cloud

- Multiple Telegram accounts
- Shared vaults
- Link sharing

### AI

- Smart folder suggestions
- Duplicate detection
- OCR search
- Auto organization

---

## 9. Security

### Encryption

```text
Original File
      ↓
 AES-256 Encryption
      ↓
Encrypted Blob
      ↓
Telegram Storage
```

Telegram only stores encrypted files.

### Local Security

Optional:

- PIN
- Fingerprint
- Face ID

---

## 10. UI Design System

### Inspiration

- Apple Files
- Google Drive
- Notion

### Theme

| Element | Color |
|---------|---------|
| Background | #0A0A0A |
| Surface | #151515 |
| Primary | White |
| Secondary | Gray |
| Accent | Blue |

### Typography

- Inter
- SF Pro style

### Icons

- Lucide Icons

---

# 11. Navigation

Bottom Navigation

```text
Home
Search
Uploads
Settings
```

Floating Action Button:

- Upload File
- Upload Photo
- Create Folder

---

# 12. Complete Screen Map

## Screen 1 — Splash

```text
CloudNest Logo

Loading...
```

---

## Screen 2 — Onboarding

### Screen 2.1

```text
Unlimited Personal Cloud

No servers.
Your storage.
```

### Screen 2.2

```text
Offline First

Access files anywhere.
```

### Screen 2.3

```text
Encrypted Storage

Only you can read your files.
```

Button:

- Get Started

---

## Screen 3 — Login

```text
Phone Number

Continue
```

OTP verification follows.

---

## Screen 4 — Creating Vault

```text
Creating your private vault...

Done
```

---

## Screen 5 — Home Dashboard

Layout:

```text
Good Evening

Storage Used

Recent Files

Quick Access

Folders
```

Storage Card:

```text
23 GB Used
```

Recent Files:

```text
Resume.pdf
Photo.png
Project.zip
```

---

## Screen 6 — Folder View

Header:

- Folder name
- Search
- Sort

File list:

```text
Resume.pdf
Offer.pdf
Invoice.pdf
```

Floating Action Button:

- +

---

## Screen 7 — Upload Bottom Sheet

Options:

- File
- Camera
- Photos
- Folder

---

## Screen 8 — Upload Queue

Each item displays:

```text
Photo.jpg

██████░░
```

States:

- Uploading
- Waiting
- Failed

---

## Screen 9 — File Details

Displays:

- Name
- Size
- Date
- Folder

Actions:

- Move
- Rename
- Download
- Delete

---

## Screen 10 — Search

Components:

- Search bar
- Recent searches
- Live results

---

## Screen 11 — Settings

### Account

- Telegram Account

### Storage

- Cache Size
- Clear Cache

### Security

- PIN
- Biometrics

### About

- Version

---

## Screen 12 — Trash

Features:

- Restore
- Delete Forever

---

# 13. User Flow

## First-Time User

```text
Install App
    ↓
Login with Telegram
    ↓
OTP Verification
    ↓
Create Private Vault
    ↓
Home Dashboard
```

## Upload Flow

```text
Tap +
    ↓
Choose File
    ↓
Encrypt
    ↓
Upload
    ↓
SQLite Updated
    ↓
File Appears
```

## Open File

```text
Tap File
    ↓
Check Cache
    ↓
Cached?
    ├── Yes → Open
    └── No → Download → Cache → Open
```

## Delete Flow

```text
Delete
    ↓
Move to Trash
    ↓
Restore or Delete Forever
```

---

# 14. Database Schema

## Files Table

| Column | Type |
|---------|------|
| id | TEXT |
| message_id | INTEGER |
| parent | TEXT |
| name | TEXT |
| size | INTEGER |
| mime | TEXT |
| encrypted | BOOLEAN |

## Folders Table

| Column | Type |
|---------|------|
| id | TEXT |
| parent | TEXT |
| name | TEXT |

## Upload Queue

| Column | Type |
|---------|------|
| id | TEXT |
| file | TEXT |
| status | TEXT |

---

# 15. Offline Sync Engine

States:

- Pending
- Uploading
- Uploaded
- Failed

Sync Rules:

| Event | Action |
|--------|---------|
| Internet returns | Resume uploads |
| App opens | Check queue |
| File opened | Cache locally |
| Cache full | LRU cleanup |

---

# 16. Performance Targets

| Metric | Target |
|---------|---------|
| App Launch | Under 2 sec |
| Folder Open | Under 300 ms |
| Search | Under 100 ms |
| Upload Start | Under 1 sec |
| Cache Hit | Instant |

---

# 17. Development Roadmap

## Phase 1 — MVP (2–3 Weeks)

- Authentication
- Private channel creation
- SQLite
- Upload
- Download
- Folder UI

Deliverable:

- Fully functional offline-first cloud drive.

---

## Phase 2

- Encryption
- Search
- Upload queue
- Trash
- File previews

---

## Phase 3

- Biometrics
- Multi-account support
- Shared vaults
- AI organization
- Smart search

---

# 18. Risks and Challenges

## Technical Risks

- MTProto integration with Expo requires native modules.
- iOS background uploads have limitations.
- Telegram API rate limits.
- Session expiration handling.
- Large file upload reliability.

## Product Risks

- Telegram policy changes.
- App Store review concerns regarding Telegram-based storage.
- Users deleting the private channel manually.

## Mitigation

- Automatic vault recovery.
- Local metadata rebuild.
- Upload retry system.
- Encrypted storage independent of Telegram UI.

---

# 19. Long-Term Vision

CloudNest should evolve from a Telegram-powered storage app into a **personal cloud operating system** where Telegram becomes an invisible infrastructure layer.

The long-term experience combines:

- Apple Files
- Google Drive
- Notion

into a premium offline-first file manager with encrypted storage, intelligent organization, and seamless synchronization—all while maintaining a zero-backend architecture that costs virtually nothing to operate.
