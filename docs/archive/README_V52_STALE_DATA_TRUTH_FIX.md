# V52 — Stale-data truth + cache fix

This version fixes the misleading green timestamp and browser caching.

- Header now says **Last actual data change**.
- Shows **No new values fetched** when a GitHub run did not change data.
- Shows **STALE DATA** when source dates are older than the current day.
- Adds cache-busting query strings to `auto-data.js`, `auto-status.js`, `ongoing-details.js`, `app.js`, and CSS.
- Keeps the V51 Sub Engineer Daily report.
- Fetch diagnostics explicitly warn when the direct machine-readable source secrets are not configured.

## Required for real unattended fresh data
Set GitHub repository secrets:
- `VBGRAM_DAILY_REPORT_XLSX_URL` = direct-download URL for latest Daily Report.xlsx
- `VBGRAM_ONGOING_CSV_URL` = direct-download URL for latest Ongoing work CSV

Without a direct machine-readable URL/session, the official MIS CAPTCHA/session can block GitHub Actions; V52 will no longer pretend that stale data is fresh.
