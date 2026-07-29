# PWA PR Checklist

Use this checklist before merging the online-first PWA branch. Mark each item as Passed, Failed, or Not executed for the final PR review.

| Check | Status | Notes |
| --- | --- | --- |
| Branch synchronized with `origin/main` | Failed | `origin/main` has one commit not in this branch; synchronize before merge. |
| Frontend lint | Passed | `npm.cmd run lint` passed. |
| Frontend build | Passed | `npm.cmd run build` passed and generated PWA artifacts. |
| Production preview | Passed | Temporary preview returned expected HTTP statuses and was stopped. |
| Manifest check | Passed | Generated manifest fields and icon paths were inspected. |
| Service-worker check | Passed | Generated `sw.js` uses prompt update handling and app-shell precache. |
| Static cache inspection | Passed | Generated precache entries are static shell assets, icons, and manifest only. |
| API fallback 404 check | Passed | `/api/not-a-real-route` returned 404, not `index.html`. |
| Offline notice | Not executed | Confirm Indonesian notice appears while offline. |
| Installability | Not executed | Confirm in a supporting browser. |
| Standalone launch | Not executed | Confirm installed app opens standalone. |
| Update prompt | Not executed | Confirm update prompt appears after a new build. |
| No automatic reload | Not executed | Confirm reload happens only after `Perbarui Sekarang`. |
| Camera layering | Not executed | Confirm PWA prompts stay below camera overlay. |
| Upload regression | Not executed | Confirm online MinIO upload still works. |
| Final submit regression | Not executed | Confirm online final submit still works. |
| Dependency audit note | Passed | `npm audit` reports high-severity advisories. Fixes require `npm audit fix --force` breaking changes; no force fix applied. |
| No backend changes | Passed | PWA branch changes are frontend/docs only; keep local backend seed file excluded. |
| No database changes | Passed | No PWA migration or schema changes. |
| No sensitive cache | Passed | Generated SW has no runtime cache for API, MinIO, JWT, GPS, records, or photos. |
| `apps/backend/seed-passwords.js` excluded | Passed | File is unrelated local dirty state and must not be staged. |

## Audit Notes

- `vite-plugin-pwa@1.3.0` brings `workbox-build@7.4.1`; npm reports a development-tooling advisory through `@trickfilm400/rollup-plugin-off-main-thread -> ejs -> jake -> filelist -> minimatch -> brace-expansion`.
- `react-router-dom@7.18.1` brings `react-router@7.18.1`; npm reports a React Server Components advisory. This app is currently a client-rendered SPA and does not intentionally use React Server Components.
- npm currently suggests `npm audit fix --force` for both advisory groups, which would make breaking dependency changes. Do not apply that automatically during PR preparation.
