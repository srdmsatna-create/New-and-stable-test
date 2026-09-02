# SRDM SATNA — VB-G RAM G Daily Monitoring (V69)

Canonical production dashboard for Satna + Maihar (8 Janpads), deployed on GitHub Pages at `srdmsatna.online`.

## Production update path
`ONE_CLICK_DASHBOARD_DATA_UPDATE.bat` → local Playwright MIS fetch → official merge → daily history snapshot → validation/tests → Git commit/push. GitHub Actions is validation-only and does not scrape the MIS portal.

## V69 architecture
- `index.html`: lightweight UI shell.
- `auto-data.js`, `auto-status.js`: current snapshot.
- `ongoing-details.js`: work-level dataset, lazy-loaded only when needed.
- `app.js`: dashboard application logic.
- `modules/search.js`: universal GP/Sub Engineer/Cluster/Work search.
- `modules/trends.js` + `data/history/summary-history.csv`: daily historical trends.
- `service-worker.js` + `manifest.webmanifest`: PWA/offline last-good-cache support.
- `scripts_local/local_auto_update.py`: canonical local Playwright scraper.
- `scripts/validate_repository.py` + `tests/`: regression/integrity checks.

## Temporary business rule
The existing PMAY-G / Ek Bagiya ongoing lock through **06-09-2026** is intentionally retained unchanged. Tests guard against accidental removal.

## Repository hygiene
V69 removes stale/duplicate generated files and obsolete update entry points. Secondary historical documentation is archived under `docs/`; this README is authoritative.

## V69 UI correction / visual pass
- **Light mode is the default.** Dark mode is now opt-in from the header toggle; the browser remembers the choice in `localStorage`.
- Removed automatic `prefers-color-scheme` switching so OS dark mode can no longer unexpectedly recolor the dashboard.
- Inter is explicitly loaded in `<head>` from Google Fonts and used as the primary Latin UI font, with Noto Sans Devanagari/system fallbacks if the font CDN is unavailable.
- `assets/social-preview.svg` and `assets/social-preview.png` now use the same SRDM shield, data-bar motif, blue gradient, and gold accent language as the favicon.
- `incoming/Daily Report.xlsx` is explicitly ignored in `.gitignore` and remains a local/generated source workbook rather than a repository asset.
- The earlier CSS cleanup remains in place: one `:root` block and fewer than 500 retained `!important` declarations, with high-risk legacy/print overrides left intact.
- Dense report tables keep readable screen sizing and horizontal scrolling.
- Release banner, service-worker cache, asset query strings, validation checks and deployment notes are aligned to V69.
