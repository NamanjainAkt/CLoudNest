# Auth & Telegram MTProto Transport

> Sources: `app/(auth)/{sign-in,otp-verify,create-vault}.tsx`, `services/telegram/{countries,types,mtprotoClient,gramjsClient,polyfill,reviewBypass}.ts`, `components/auth/{CountryPickerModal,RestoreVaultModal,BiometricLockOverlay}.tsx`.

## Auth flow

1. `sign-in.tsx`: country defaults to India `+91` (`DEFAULT_COUNTRY` in `countries.ts`); `extractCountryAndNumber` auto-detects pasted `+<code><number>`; `MTProtoClient.sendCode(fullPhone)` → push `otp-verify {phone, hash}`.
2. `otp-verify.tsx`: 5-or-6-digit slots (Telegram default is 5); `MTProtoClient.signIn` → push `create-vault`.
3. `create-vault.tsx`: `generateMasterSeed()` → `saveMasterKey` → `createPrivateVaultChannel` → `setSession` → `replace('/(tabs)')`. 2FA (`SESSION_PASSWORD_NEEDED`) throws — no password step.
4. Restore path: `RestoreVaultModal` (`mnemonicToSeedHex` → `saveMasterKey` → channel `{Restored Vault}`).

## Country selector

`COUNTRIES[51]`, quick chips `IN,US,GB,AE,CA,DE,SG,AU`; per-country `format`/`maxLength` (IN 5-5). No libphonenumber validation.

## DC routing (`types.ts`)

| DC | Location | IP | Edge WSS |
|---|---|---|---|
| DC1 | Miami | `149.154.175.50` | `pluto.web.telegram.org/apiws` |
| DC2 | Amsterdam | `149.154.167.51` | `venus.web.telegram.org/apiws` |
| DC4 (default) | Frankfurt | `149.154.167.91` | `vesta.web.telegram.org/apiws` |
| DC5 | Singapore | `91.108.56.165` | `flora.web.telegram.org/apiws` |

DC3 omitted; IPs hardcoded. `checkDcLatency` is HTTP-HEAD heuristic (1500 ms abort, calibrated baselines on failure), not MTProto ping.

## GramJS engine (`gramjsClient.ts`)

- `useWSS:true`, `connectionRetries:5`, `autoReconnect:true`; `getSender` pinned to primary `_sender` (avoids 30 s exported-sender drop).
- `createPrivateVaultChannel`: dedupes by title `CloudNest Private Vault [E2EE]` via `getDialogs(30)` else `channels.CreateChannel`; any failure → `'me'` (Saved Messages, zero access-hash).
- `resolveTargetPeer`: `getInputEntity` → `getDialogs(50)` re-prime → `'me'`.
- Uploads: `uploadEncryptedBlob` (legacy whole-buffer `sendFile`, progress only — name/caption/`.enc` suffix are mislabels, no encryption inside) and `uploadFileStreaming` (production path — raw 512 KB slices, `SaveFilePart` ≤10 MB / `SaveBigFilePart` >10 MB, 5 chunk retries + `FLOOD_WAIT_X` sleep; `masterKeyHex` param accepted but unused). Download: `downloadFile` (`iterDownload` raw append, no decryption).

## Gaps

- `mtprotoClient.ts` ships hardcoded `apiId/apiHash` fallbacks — live creds in bundle.
- OTP screen imports `useVaultStore` but never uses it (session set later in create-vault).
- Hermes RNG depends on polyfill load order; final fallback is `Math.random` (non-CSPRNG) if `expo-crypto` unready.

## Play-review bypass (`reviewBypass.ts`)

- `REVIEW_PHONE_DIGITS 919999999999` (`+91 99999 99999`), `REVIEW_CODE 55555`, `REVIEW_CODE_HASH REVIEW_MODE`. Phone match is digit-normalized so `+91 99999 99999` UI formatting still hits.
- `MTProtoClient.sendCode` short-circuits review numbers to `{ phoneCodeHash: REVIEW_MODE }` with no GramJS network. `signIn` accepts only `55555` on that hash/phone and returns a synthetic `Review Reviewer` user; `createPrivateVaultChannel` returns a local-only `review-vault` session (persisted to SecureStore) instead of calling Telegram.
- Verified 2026-09-27: `npm run lint` 0 errors, `npm run test` 73/73 pass. Real-user MTProto path untouched; Play Console testing-credentials use phone `+919999999999` + code `55555`.
