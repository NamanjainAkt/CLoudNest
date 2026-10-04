# Google Play Store Compliance

> Scope: Play Console declarations for the CloudNest listing (app `4973211743768335546`, developer account `7747423751858043416`).
> Sources: `services/telegram/gramjsClient.ts`, `services/telegram/mtprotoClient.ts`, `store/useVaultStore.ts`, `services/crypto/*`, `package.json`, `app.json`, `android/app/src/main/AndroidManifest.xml`, `services/telegram/reviewBypass.ts`, Play Console Data safety form (filled 2026-09-30).

## Data safety form — submitted answers

Filled 2026-09-30 via Play Console → App content → Data safety. Status after save: **"Change saved. Send for review in Publishing overview."** (not yet sent for review).

| Step | Question | Answer |
|---|---|---|
| 2 | Collects/shares required user data types? | **Yes** |
| 2 | All collected data encrypted in transit? | **Yes** |
| 2 | Account creation methods | **My app does not allow users to create an account** |
| 2 | Login with externally-created accounts? | **Yes** → created via *out-of-app identification* (SIM/phone verification in the Telegram client) |
| 2 | Data-deletion request mechanism? | **Yes** → `https://cloudnest-v1.netlify.app/` |
| 3 | Data types | **Personal info → Phone number**, **Files and docs → Files and docs** |
| 4 | Phone number | Collected + Shared · not ephemeral · **required** · purpose: App functionality (authenticate) — same purpose for sharing |
| 4 | Files and docs | Collected + Shared · not ephemeral · **required** · purpose: App functionality (store/sync) — same purpose for sharing |
| 5 | Store listing preview | Data shared: Phone number, Files and docs · Data collected: Phone number, Files and docs · Delete data URL + Privacy policy both `https://cloudnest-v1.netlify.app/` · "Data is encrypted in transit" |

Everything else (Location, Messages, Photos and videos, Audio files, Calendar, Contacts, App activity, Web browsing, App info and performance, Device or other IDs) declared as **not** collected/shared.

## Why each answer is defensible (code evidence)

- **Phone number → off device.** `MTProtoClient.sendCode`/`signIn` hand the number to GramJS `auth.sendCode`/`auth.signIn` (`services/telegram/gramjsClient.ts`). Only `signIn` is used — never `auth.signUp` — hence "no in-app account creation". Session is authenticated as an existing Telegram account.
- **Encryption in transit = Yes.** All Telegram traffic is MTProto over WSS edge sockets (`services/telegram/types.ts` DC table, default DC4 Frankfurt); the DC latency probe is an HTTPS HEAD.
- **File *contents* fall under Play's end-to-end-encryption exemption.** Blob bytes are AES-256 encrypted client-side; the key lives only in `expo-secure-store` (`cloudnest_master_key`), never transmitted, so neither the developer nor Telegram can read them. Media permissions (`READ_MEDIA_IMAGES/VIDEO/AUDIO`) are on-device only.
- **Files and docs *is* declared because metadata is plaintext.** `InputFileBig.name`, `InputFile.name`, `Api.DocumentAttributeFilename({fileName})` and the caption `fileName + '\n\n#CloudNest'` transmit the **file name and MIME type unencrypted** to Telegram. Play's "Files and docs" type explicitly covers "information about their files or documents such as file names".
- **No analytics / crash / ads SDKs.** `package.json` has no Firebase, Sentry, Crashlytics, or ad SDK; `app.json` manifest permissions are INTERNET, ACCESS_NETWORK_STATE, USE_BIOMETRIC, USE_FINGERPRINT, READ_MEDIA_*, RECORD_AUDIO, SYSTEM_ALERT_WINDOW, VIBRATE, WAKE_LOCK, FOREGROUND_SERVICE(_DATA_SYNC). No diagnostics, no in-app search history off device (`cloudnest_recent_searches` is SecureStore-only), no device/advertising IDs.
- **Deletion = Yes.** `deleteFilePermanently` and `emptyTrash` call `client.deleteMessages(peer, [id], {revoke: true})`, which hard-deletes the Telegram copy, then wipe the FileSystem cache and the SQLite row. Trash also auto-purges after the 30-day retention window.

## Gaps / risks

0. **P0 — E2EE exemption no longer valid (2026-10-04).** The filed Data safety form treats file *contents* as client-side AES-256 end-to-end-encrypted with the key only in SecureStore. Code read on 2026-10-04 verified uploads/downloads move **plaintext** (`uploadFileStreaming`/`downloadFile` have no cipher step; `backgroundSync` writes `isEncrypted:false`). Before sending anything for review: re-file without the E2EE basis, and scrub the `AES-256 encrypted files` short description + full-description encryption claims from the store listing, or re-introduce real encryption. Submitting E2EE claims for plaintext storage risks a policy strike.
1. **P1 — declaration contradicts the product's zero-knowledge story.** File names and MIME types leave the device in cleartext while the store listing and UI imply full client-side encryption. Either encrypt the filename/mime into the blob (upload only `#CloudNest` as the caption, store the name inside the ciphertext) or drop "zero-knowledge / E2EE" wording from user-facing copy. Google treats listing/behavior mismatch as actionable. (Update 2026-10-04: with content encryption also removed, the whole listing premise — not just filenames — mismatches. Dropping the wording is now mandatory, not optional.)
2. **P2 — "required" for Files and docs is a judgment call.** Storage is the app's primary functionality, so collection is declared required. If review pushes back (a user can browse without uploading), flip to "Users can choose whether this data is collected" in step 4.
3. **P2 — `cloudnest-v1.netlify.app` must actually serve a deletion-request page** naming the app/developer, the steps, and which data is deleted vs retained. The same URL is also the store-listing Privacy policy. A dead page here is a review blocker for both declarations.

## Foreground-service demo video (2026-10-01)

Built with HyperFrames in repo `fgs-demo-video/` → `cloudnest-foreground-service-demo.mp4` (1920×1080, 60s, H264+AAC, ~16MB): 5 scenes (hook → encrypt/upload → leave-the-app hero with a reconstructed persistent notification → verified sync → one-job resolve), Kokoro TTS voiceover (`am_adam`, 5 segments ~42s), screenshots rendered from the Stitch blueprints, Space Grotesk + JetBrains Mono, `npm run check` clean (54/54 contrast). No burned-in captions (whisper-cpp unavailable; YouTube auto-captions cover it). AI-asset call made on the listing: "Don't label assets". ## Closed testing submitted for review (2026-10-01)

User uploaded bundle **vc3 / 1.0.0** (28.6 MB, target SDK 36, API 24+) via EAS; attached it from the library to the closed-testing Alpha draft (was: 3 errors — no bundle). Added en-US release notes. Cleared 2 declaration errors: **Foreground Service** = Backing up, restoring + demo video `https://youtu.be/h7TXtOQY3Vg` (HyperFrames explainer, see above); **Photo/Video permissions** = backup/restore justifications for READ_MEDIA_IMAGES/VIDEO. Remaining warning (benign): no deobfuscation file. Blocker on submit was **Advertising ID declaration** = No (no ad SDKs in `package.json`, no AD_ID in manifest). Submitted **14 changes for review** from Publishing overview: closed release (full rollout, 177 countries, testers = `Nfit testers` email list, track resumed), store listing, Data safety, Health apps, Government/Financial declarations, Productivity category, privacy policy URL, ads declaration. Status: "Changes in review" — quick checks then Google review (typically ≤7 days).

Production path after approval: closed test must run with **≥12 testers opted in for ≥14 days**, then apply for production access. Package `com.cloudnest.vault`.

## Release state (2026-09-30, updated — setup 11/11 complete)

"Finish setting up your app" reached **11/11** — the setup card is gone from the dashboard. All changes sit in Publishing overview → "Changes not yet submitted for review": Content Rating, Target audience and content, Privacy policy, Ads declaration, **Data safety**, **Health apps**, Sign-in details note, 'Government apps' + 'Financial features' declaration updates, **Store settings: App category (Productivity app)**, **Store listings: Default store listing**.

Store listing (en-US) as saved: name `Cloudnest`; short `Your private cloud vault. AES-256 encrypted files on Telegram storage.` (70 chars); full description (~1.4k chars: encrypted vault, offline-first, chunked uploads, search, inspector, 30-day trash, privacy note, Telegram non-affiliation); icon `store-listing/icon-512.png` (512×512, resized from `assets/icon.png`); feature graphic `store-listing/feature-graphic.png` (1024×500, PIL-composed from the brand icon + tagline); 4 phone screenshots 1080×1920 9:16 (`shot-1-home`, `shot-3-uploads`, `shot-4-details`, `shot-5-search` — rendered from the Stitch `code.html` blueprints at 540×960 CSS ×2 DPR mobile emulation, broken `<img>` asset refs hidden). AI-asset declaration answered **Don't label assets** (no generative-AI step in the upload flow; designs predate it — flip if policy asks). Contact: `namanjainakt007@gmail.com` + website `https://cloudnest-v1.netlify.app/`. Graphics live in repo `store-listing/` (6 files).

"Send app for review" is still **disabled** ("complete the required steps in the app dashboard"). Remaining gates are release-track work, not setup: publish a closed-testing release, get **≥12 testers opted in for ≥14 days** (currently 0), then apply for production access. Package name: `com.cloudnest.vault`.
