# PWA QA Checklist

Use production preview for this checklist unless a step explicitly says otherwise.

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

## Service Worker And Cache

- Run `npm run preview` and open the preview URL.
- Confirm one active service worker is registered for the frontend scope.
- Confirm Cache Storage contains static app-shell assets only.
- Confirm there are no cached `/api/*` responses.
- Confirm there are no cached MinIO objects, presigned URLs, camera Blob URLs, JWT tokens, or Authorization headers.

## Install

- In a supporting browser, confirm the app is installable.
- Confirm the in-app install prompt appears only when `beforeinstallprompt` is available.
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
