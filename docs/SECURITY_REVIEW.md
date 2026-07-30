# Security Review

Review date: 2026-07-30

Status values: `Passed`, `Failed`, `Not executed`, `Accepted risk`.

## Authentication And Authorization

| Area | Status | Notes |
| --- | --- | --- |
| Login source of role | Passed | Login accepts email and password only; role comes from backend user data. |
| Password-change enforcement | Passed | Protected routes redirect users with `must_change_password` to `/change-password`. |
| Admin route protection | Passed | Admin routes use `verifyToken` and `requireAdmin`. |
| Driver route protection | Passed | Daily Check routes now use `verifyToken` and `requireDriver`. |
| Upload ticket as auth | Passed | Upload tickets lack normal auth claims and return `401` as bearer auth. |
| Auth JWT as upload ticket | Passed | Photo confirmation requires upload-ticket purpose `photo-upload`. |
| Logout storage cleanup | Passed | Logout clears `token` and `user` from localStorage. |
| Network failure logout | Passed | Axios logout behavior only runs when a backend `401` response exists. |

## Shared Driver Accounts

| Area | Status | Notes |
| --- | --- | --- |
| Required actual driver name | Passed | Whitespace-only names are rejected for shared accounts. |
| Name normalization | Passed | Shared account names are trimmed before persistence. |
| Ordinary driver spoofing | Passed | Ordinary driver-created checks persist `actual_driver_name` as `null`. |

## Upload Ticket And Storage Trust

| Area | Status | Notes |
| --- | --- | --- |
| Ticket binding | Passed | Ticket binds purpose, Driver, daily check, logical slot, object key, content type, and expiry. |
| Backend-generated key | Passed | Frontend receives object key from presign flow but cannot provide it during confirmation. |
| Safe namespace | Passed | Keys and cleanup prefixes are constrained to `inspections/`. |
| Content type and extension | Passed | Upload flow allows JPEG, PNG, and WebP and derives matching extensions. |
| Object metadata | Passed | Confirmation checks object existence, content type, and non-zero size. |
| Delete trust source | Passed | Confirmed-photo delete uses database key; pending cancel uses signed-ticket key. |
| Cleanup exposure | Passed | Cleanup is a backend script only; no HTTP cleanup endpoint exists. |

## Database Locking And Consistency

| Area | Status | Notes |
| --- | --- | --- |
| Confirmation locking | Passed | Confirmation locks `daily_checks` with `FOR UPDATE`. |
| Submit locking | Passed | Submit locks the same daily-check row. |
| Delete locking | Passed | Confirmed-photo deletion locks the same daily-check row. |
| Idempotent confirmation | Passed | Same-ticket retry returns existing row without a second insert. |
| MinIO/PostgreSQL transaction gap | Accepted risk | They are not a distributed transaction; retry and orphan cleanup reduce abandoned-object risk. |
| Row lock during MinIO call | Accepted risk | Confirmation/delete may hold the daily-check row lock during MinIO `HeadObject` or `DeleteObject`; this favors correctness for MVP. |

## PWA, Cache, And Browser Storage

| Area | Status | Notes |
| --- | --- | --- |
| Service-worker registration | Passed | One registration path through `vite-plugin-pwa`. |
| App-shell caching | Passed | Generated service worker precaches build assets only. |
| API fallback exclusion | Passed | `/api/*` is denied from SPA navigation fallback. |
| API/MinIO runtime caching | Passed | No Workbox runtime caching routes are configured. |
| Auth localStorage | Accepted risk | JWT and user summary are persisted in localStorage for MVP simplicity. |
| Pending confirmation sessionStorage | Passed | Contains only dailyCheckId, slot data, object key, upload ticket, and expiry. |
| Image/Blob persistence | Passed | No Blob, Base64, image bytes, presigned URL, GPS, driver identity, or vehicle data are stored in pending metadata. |

## Dependency Advisories

| Package area | Status | Notes |
| --- | --- | --- |
| Frontend runtime audit | Accepted risk | `react-router-dom`/`react-router` high advisory concerns RSC mode; this app is a client-rendered SPA and does not intentionally use RSC APIs. |
| Frontend full audit | Accepted risk | PWA build tooling pulls high advisories through Workbox build-time dependencies; reachable during build, not runtime app code. npm suggested downgrades/major changes, so no silent change was made. |
| Backend runtime audit | Passed | `npm.cmd audit --omit=dev` reported zero vulnerabilities. |
| Backend full audit | Accepted risk | Dev-only `brace-expansion` advisory is through `nodemon -> minimatch`; not installed in runtime-only audit. |

## Unresolved Issues

- Browser-controlled UAT for camera, geolocation, PWA install/update prompts, and offline transitions remains not executed.
- Photo validation relies on S3 metadata and does not sniff file magic bytes.
- Production deployment should use strong `JWT_SECRET`, private S3 credentials, HTTPS, and non-demo seed credentials.
