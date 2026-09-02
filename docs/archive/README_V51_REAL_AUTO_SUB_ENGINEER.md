# V51 — Real Freshness + Sub Engineer Same Report

## 1. Fake auto-update time fixed
`Last data change` now changes only when parsed report values actually change.
A successful scheduled fetch is shown separately as `Source checked`.
If the portal returns the same old report, the dashboard will no longer pretend that the data changed.

## 2. Direct CSV/XLSX source support
GitHub Actions now supports these optional repository secrets:

- `VBGRAM_ONGOING_CSV_URL` — direct downloadable latest dynamic_work_details CSV URL
- `VBGRAM_DAILY_REPORT_XLSX_URL` — direct downloadable Daily Report workbook URL

Direct machine-readable URLs are tried first. Official browser/portal scraping remains a fallback.
This is the preferred way to avoid CAPTCHA/session failures.

## 3. Sub Engineer report — same format as Janpad
The old `Engineer-wise` tab is upgraded to `Sub Engineer Daily`.
It now shows the Janpad report structure at Sub Engineer level:

- Total GP / GP Progress / Dysfunctional GP
- Labour / Works with MR / No e-KYC / Muster Rolls / Ongoing / MR %
- Individual Land labour / MR
- Community labour / MR / share
- PMAY-G ongoing / MR / MR %
- Ek Bagiya labour / ongoing / MR / MR %

Engineer rows are reconciled so that each Janpad's Sub Engineer rows sum back to the official Janpad totals. Where the official source only exposes a Janpad-level field, that field is proportionally allocated using the closest available engineer-level workload basis. It is therefore a reconciled monitoring distribution, not an independent engineer-level official source field.

## 4. Latest ongoing CSV link
The portal download link now points to:
`data/Ongoing_Works_dynamic_work_details_latest.csv`

## GitHub upload
Upload/replace the complete package preserving folders:
- `.github/workflows/`
- `scripts/`
- `data/`
- `incoming/`
- root JS/HTML/CSS files

Then run: Actions → `VB-G RAM G Daily Auto Report` → Run workflow.
