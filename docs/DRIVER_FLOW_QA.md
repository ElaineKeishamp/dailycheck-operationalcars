# Driver Flow QA Checklist

Use this checklist for focused regression passes on the driver daily-check flow. It intentionally avoids admin-only behavior except where driver deletion lockout needs a submitted report.

## Start Session

- Log in as a driver and confirm `/dashboard` is the only driver entry point.
- Confirm the vehicle selector is disabled while vehicles are loading or after a session becomes active.
- Deny location permission and confirm checking cannot start.
- Grant location permission and confirm checking can start only after a vehicle is selected.
- For a shared driver account, confirm the actual driver name is required before start.

## Resume Session

- Start a check, leave the page, then return to `/dashboard`.
- Confirm the active incomplete check is resumed for the selected vehicle.
- Confirm previously uploaded photo slots are restored before submit is enabled.
- Confirm restored uploaded slots cannot be captured again from the driver page.

## Photo Capture And Upload

- Capture each standard required photo slot.
- Capture all four tire slots and confirm each tire slot is treated independently.
- Confirm every accepted photo includes the watermark with date/time and GPS coordinates.
- Simulate a failed upload and confirm retry is available without enabling submit.
- Confirm the frontend uses the presigned URL flow and does not send `multipart/form-data`.

## Delete Uploaded Photo And Retake

- Upload one required photo, choose `Hapus & Ambil Ulang`, cancel the confirmation, and confirm the uploaded slot remains complete.
- Confirm deletion shows a loading state and the slot only becomes incomplete after the backend responds successfully.
- Confirm the deleted slot can be captured and uploaded again through the normal camera flow.
- Refresh the page after deletion and confirm the deleted photo is not restored from the backend.
- Go offline, try to delete an uploaded photo, and confirm the UI keeps the uploaded photo and shows a clear Indonesian error.
- Submit the report, then confirm uploaded photos cannot be deleted from the driver page.
- Confirm there is no admin-facing delete-photo control.

## Submit

- Confirm submit remains disabled while photos are loading, uploading, failed, or incomplete.
- Submit only after all required slots are uploaded.
- Confirm the UI switches to a completed state after backend status is `submitted`.
- Attempt a duplicate submit and confirm the driver UI remains locked or completed.
- Confirm the completed state does not imply a submit timestamp unless the backend provides one.

## Accessibility And Mobile

- Open the camera overlay and confirm keyboard focus moves into it and returns after close.
- Open the submit confirmation dialog and confirm keyboard focus moves into it and returns after close.
- Open the delete-photo confirmation dialog and confirm keyboard focus moves into it and returns after close.
- Confirm Escape closes the submit dialog when it is not submitting.
- Confirm Escape closes the delete-photo dialog when it is not deleting.
- Check a narrow mobile viewport for clipped labels, overlapping sticky submit controls, and unusable buttons.
