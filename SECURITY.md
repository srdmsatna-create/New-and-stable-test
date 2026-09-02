# Security Policy — V69

## Supported release

The active supported dashboard release is **V69** (`V69-UI-FIX-2026-09-02`). Historical V44–V65 notes are retained only for reference under `docs/archive/`.

## Secrets and credentials

Do not commit usernames, passwords, session cookies, `.env` files, browser profiles, or credential text files to this repository. `LOGIN_CREDENTIALS.txt` was removed from the cleaned V69 package and credential-like files are ignored by `.gitignore`.

If any credential from an older repository copy was ever pushed to a public or shared Git remote, rotate/change that credential because deleting the latest file does not remove older Git history.

## Data publishing safety

The production update path is the local Playwright updater. Generated data is validated before Git push. The GitHub Action is validation-only and has read-only repository permissions; it does not scrape the MIS portal or write dashboard data.

## Reporting a problem

If a release shows unexpected official totals, stop publishing new data, preserve the last verified files, and inspect `data/fetch-status.json`, `data/official-summary.csv`, and the validation output before the next push.
