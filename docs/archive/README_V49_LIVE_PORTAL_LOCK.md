# V49 Live Portal Lock

This build fixes the morning auto-update mismatch.

- The current official VB-G RAM G Screen-2 HTML table is the final authority for shared KPIs.
- If an Excel export is available, it is used for RepDay/VBG/rich drill-down fields only.
- After workbook generation, the live Screen-2 summary is merged last, so a stale Excel export cannot overwrite current portal values.
- auto-data.js and auto-status.js are loaded with a per-page timestamp to prevent browser/GitHub Pages cache from showing yesterday/earlier values.
- Validation rejects publication if the generated daily/official shared metrics differ from data/official-summary.csv.
- Existing 07:30 AM IST scheduled refresh is retained.
