# Final UAT Matrix

Environment: local Windows workspace on `chore/final-qa-stabilization`, PostgreSQL local database, local MinIO, production frontend build and preview HTTP checks. Browser-controlled UAT was not available in this pass, so browser-only scenarios are marked `Not executed`.

Status values: `Passed`, `Failed`, `Not executed`.

Business rule stabilized in Phase 13: a vehicle or driver is counted as checked today only after the Daily Check reaches `submitted`. An `incomplete` Daily Check remains resumable after refresh and must not remove the vehicle from the normal Driver vehicle-selection flow.

## Driver UAT

| Scenario | Status | Notes |
| --- | --- | --- |
| Login ordinary Driver | Not executed | Browser/runtime login not executed in this pass. |
| Login shared account and supply actual Driver name | Passed | Backend rejects whitespace-only names, trims valid names, and stores them only for shared accounts. |
| Required password-change redirect | Not executed | Route/code review passed; browser flow not executed. |
| Vehicle list loads | Not executed | Browser flow not executed. |
| Checked vehicles are filtered as intended | Not executed | Browser flow not executed. |
| Geolocation preparation works | Not executed | Browser geolocation not executed. |
| Create daily check | Passed | Targeted backend runtime test passed for ordinary and shared driver creation. |
| Refresh and resume active session | Not executed | Backend API runtime retest passed for incomplete sessions with confirmed photo, zero photos, and pending confirmation. Manual browser refresh/resume has not been executed. |
| Capture each photo category | Not executed | Browser camera not executed. |
| Upload normal required photo | Passed | Phase 12 runtime verified presign, MinIO PUT, and confirmation. |
| Upload Ban 1-4 | Passed | Phase 12 runtime verified required logical slot handling. |
| Upload optional lainnya | Passed | Phase 12 submitted-confirmation scenario used optional `lainnya`. |
| Refresh and restore confirmed photos | Passed | Backend API runtime retest confirmed uploaded photo records remain available after simulated refresh/resume. Browser-controlled photo rendering remains not executed. |
| Delete normal photo | Passed | Phase 11/12 runtime verified delete-before-submit behavior. |
| Delete tire photo | Passed | Phase 11/12 runtime verified indexed tire deletion. |
| Delete optional photo | Passed | Phase 11 runtime verified deletion of an uploaded optional `lainnya` photo before submission. |
| Upload replacement | Passed | Phase 11 runtime verified delete and retake before submit. |
| Simulate pending confirmation | Not executed | Backend behavior and frontend code path were verified, but the pending-confirmation UI was not tested in a browser. |
| Retry confirmation without second PUT | Not executed | Static code inspection confirms retry calls the confirmation endpoint only, but browser Network-panel proof was not executed. |
| Cancel pending confirmation | Passed | Phase 12 runtime cancellation tests passed. |
| Confirm all 11 required logical slots | Passed | Phase 12 runtime verified 11/11 required logical slots. |
| Submit report | Passed | Phase 12 confirm-wins scenario submitted successfully. |
| Refresh completed report | Not executed | Browser refresh/runtime not executed. |
| No edit/delete/upload controls after submit | Not executed | Code review passed; browser runtime not executed. |
| Direct mutation after submitted rejected | Passed | Phase 12 runtime confirmed submitted confirmation/delete rejection. |
| Offline notice | Not executed | Browser offline mode not executed. |
| Offline upload/confirm/delete/submit blocked | Not executed | Browser offline mode not executed. |
| Reconnect does not auto retry | Not executed | Browser network transition not executed. |
| PWA install/standalone where supported | Not executed | Browser PWA install not executed. |
| Update prompt does not auto reload | Not executed | Multi-build browser update test not executed. |

## Admin UAT

| Scenario | Status | Notes |
| --- | --- | --- |
| Admin login | Not executed | Browser/runtime login not executed. |
| Admin dashboard | Not executed | Browser page UAT not executed. |
| Report list | Passed | Backend report list route/import and targeted filter runtime passed. |
| Report detail | Not executed | The UI code was reviewed and fixed, but the report-detail page was not opened and verified manually in a browser. |
| Submitted timestamp | Not executed | Browser page UAT not executed. |
| Driver/shared Driver name | Not executed | Backend storage and UI code were verified, but the displayed actual Driver name was not checked manually in the browser. |
| Photo display and tire mapping | Not executed | UI code labels indexed tire photos as `Ban 1` through `Ban 4`, but browser rendering was not manually verified. |
| Driver cannot access Admin route | Not executed | Route protection was verified through code review, but the Driver-to-Admin browser navigation scenario was not executed. |
| Admin cannot use Driver mutation route | Passed | Daily Check routes now require `requireDriver`; targeted runtime returned `403`. |

## Known Limitations

- Browser-controlled UAT was not executed in this pass.
- Camera, geolocation, install prompt, service-worker update prompt, and offline transition behavior still need a hands-on browser pass.
- No credentials, upload tickets, presigned URLs, private object keys, or real photos are recorded in this document.
