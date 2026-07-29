# PWA QA Checklist

Use production preview for this checklist unless a step explicitly says otherwise. Mark each item as Passed, Failed, or Not executed during a QA pass.

## Phase 10A Observations

| Check | Status | Notes |
| --- | --- | --- |
| Manifest loaded successfully | Passed | Verified in Chrome production preview. |
| One service worker activated and running | Passed | Verified in Chrome production preview. |
| Static app-shell cache exists | Passed | Cache contained static shell assets only. |
| API and MinIO objects absent from cache | Passed | No API responses or MinIO objects were observed in Cache Storage. |
| Offline application shell loads | Passed | Cached shell loaded after prior online visit. |
| Offline notice appears | Passed | Indonesian online-required notice appeared. |
| Chrome recognizes installability | Passed | Desktop Open in app was available. |
| Manifest screenshot warnings | Passed | Chrome reported richer install UI warnings for missing screenshots; these are non-blocking installability warnings. |

## Phase 10B Runtime Hardening

| Check | Status | Notes |
| --- | --- | --- |
| Install prompt stays below camera overlay | Not executed | Confirm by opening camera while install prompt is available. |
| Update prompt stays below camera overlay | Not executed | Confirm after a new production build triggers update. |
| Offline notice does not cover camera shutter | Not executed | Confirm in camera view with DevTools offline. |
| Offline transition preserves local photo draft | Not executed | Capture a draft, switch offline, and confirm preview state is not deleted. |
| Offline upload attempt fails without success state | Not executed | Attempt retry while offline and confirm no uploaded state is shown. |
| Offline final submit attempt is blocked | Not executed | Confirm submit cannot start offline. |
| Returning online does not auto-upload or auto-submit | Not executed | Confirm no queued request fires after reconnect. |
| Standalone window launch works | Passed | Desktop Open in app was observed in Phase 10A. |
| Update prompt appears after a new build | Not executed | Requires a two-build preview test. |
| Manual update confirmation only | Not executed | Confirm Nanti dismisses and Perbarui Sekarang is the only reload path. |
| No automatic reload | Not executed | Confirm while active Driver work is in progress. |

## Build Output

- Run `npm run build` from `apps/frontend`.
- Confirm `dist/manifest.webmanifest` exists.
- Confirm `dist/sw.js` and Workbox assets exist.
- Confirm PWA icons exist in `dist/icons`.

## Manifest

- Open Chrome DevTools -> Application -> Manifest.
- Confirm name is `Daily Check Operational Cars`.
- Confirm short name is `Daily Check`.
- Confirm start URL and scope are `/`.
- Confirm display mode is `standalone`.
- Confirm 192x192, 512x512, and maskable icons load without errors.
- Confirm missing screenshot warnings remain non-blocking unless screenshots are later added.

## Service Worker And Cache

- Run `npm run preview` and open the preview URL.
- Confirm one active service worker is registered for the frontend scope.
- Confirm Cache Storage contains static app-shell assets only.
- Confirm there are no cached `/api/*` responses.
- Confirm there are no cached MinIO objects, presigned URLs, camera Blob URLs, JWT tokens, or Authorization headers.
- Confirm `/api/*` is not served by the SPA navigation fallback.

## Install

- In a supporting browser, confirm the app is installable.
- Confirm the in-app install prompt appears only when `beforeinstallprompt` is available.
- Confirm the install prompt does not appear in standalone mode.
- Install the app and launch it standalone.
- Confirm the standalone app opens without a browser URL bar.
- Uninstall and reinstall during a clean test pass.

## Offline Behavior

- Load the app once while online.
- Switch DevTools Network to Offline.
- Reload `/dashboard` or another cached route.
- Confirm the app shell opens after prior cache.
- Confirm the offline banner appears with the online-required message.
- Confirm business operations do not claim success while offline.
- Confirm API-dependent areas show controlled loading/error behavior, not fake cached data.
- Return online and confirm the banner disappears.
- Confirm uploads and submit are not automatically retried.

## Updates

- Keep one production preview tab open.
- Build a new version and serve it.
- Trigger service worker update detection.
- Confirm `Versi baru tersedia` appears.
- Confirm `Nanti` dismisses without reload.
- Confirm `Perbarui Sekarang` updates only after user confirmation.
- Confirm the page does not reload automatically during upload, camera use, or submit confirmation.

## Driver Regression

- Confirm login works online.
- Confirm vehicle loading works online.
- Confirm geolocation works online.
- Confirm camera capture works online.
- Confirm MinIO upload works online.
- Confirm persisted photo restoration works online.
- Confirm final submit works online and the submitted state remains locked.

## Cleanup

- Between test passes, clear old service workers and Cache Storage in Chrome DevTools.
- Do not commit `dist`, browser profile data, or service-worker debugging artifacts.
