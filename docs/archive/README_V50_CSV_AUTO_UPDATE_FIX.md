# V50 — CSV Auto Update Fix

## Root cause found
The portal contained a dated work-level CSV (`...23-08-2026.csv`) and `ongoing-details.js` was generated from that packaged snapshot. The GitHub Action updated `official-summary.csv` / `auto-data.js`, but it did not refresh the work-level CSV or `ongoing-details.js`. Therefore the top status could change while the detailed Ongoing Work screen stayed old.

## Fix
- MIS and Ongoing exports are now downloaded independently.
- The Ongoing page export is accepted as CSV or XLSX.
- If no export button works, the script tries the captured official HTML table.
- Fresh work-level data is saved to `data/Ongoing_Works_dynamic_work_details_latest.csv`.
- `scripts/update_ongoing_csv.py` regenerates `ongoing-details.js` automatically.
- Engineer/Cluster are joined from current `auto-data.js`, with the previous mapping as fallback.
- The portal download link uses the stable `latest.csv` filename.
- Workflow commits the refreshed CSV and `ongoing-details.js`.
- Schedule runs at 07:30 and 14:30 IST, plus manual Run workflow.

## Important
If the Government portal blocks GitHub-hosted Chromium, requires CAPTCHA, or changes its HTML/export controls, the fetch can still fail. In that case the previous valid live data is intentionally preserved. A valid `VBGRAM_COOKIE` can be added as a GitHub Actions secret if the official report requires a session.
