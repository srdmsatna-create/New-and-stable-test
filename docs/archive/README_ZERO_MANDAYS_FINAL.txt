ZERO MANDAYS FINAL V3

Fixes:
1. Tab is physically present beside Mandays Generation in index.html.
2. Zero Mandays uses the SAME window.SRDM_V8_MONTHLY data as Mandays Generation (no duplicate stale data).
3. Months available: FY Total, April, May, June, July, August. September is not fabricated as zero.
4. District mapping: AMARPATAN/MAIHAR/RAMNAGAR = MAIHAR; others = SATNA.
5. Cascading filters reset correctly.
6. GP unique count is Janpad+GP based.

Deployment:
- Safest: replace repository index.html with index_ZERO_MANDAYS_FINAL.html (rename to index.html), commit and push.
- Or put all package files in repo root and run APPLY_ZERO_MANDAYS_FINAL_V3.bat.
