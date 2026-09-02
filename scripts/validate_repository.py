from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_VERSION = "V69-UI-FIX-2026-09-02"
EXPECTED_JANPADS = {
    "AMARPATAN", "MAIHAR", "RAMNAGAR", "MAJHGAWAN",
    "NAGOD", "RAMPUR BAGHELAN", "SATNA", "UNCHAHARA",
}


def fail(message: str) -> None:
    raise AssertionError(message)


def load_auto_report() -> dict:
    text = (ROOT / "auto-data.js").read_text(encoding="utf-8").strip()
    text = re.sub(r"^window\.AUTO_REPORT\s*=\s*", "", text).rstrip(";")
    return json.loads(text)


def main() -> int:
    required = [
        "index.html", "app.js", "styles.css", "auto-data.js", "auto-status.js",
        "modules/zero-mandays.js", "modules/zero-mandays.css",
        "modules/mandays-selfcontained-v8.js", "modules/zero-mandays-force-data.js",
        "scripts_local/local_auto_update.py", "scripts/merge_official_summary.py",
        "scripts/validate_auto_data.py", "scripts/archive_daily_snapshot.py", ".gitignore", "README.md", "DEPLOY_V69.txt",
        "manifest.webmanifest", "service-worker.js", "modules/theme.js", "modules/search.js", "modules/trends.js",
    ]
    missing = [p for p in required if not (ROOT / p).is_file()]
    if missing:
        fail(f"Missing required files: {missing}")

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    if EXPECTED_VERSION not in index:
        fail(f"index.html does not contain canonical build marker {EXPECTED_VERSION}")
    if "modules/zero-mandays.js?v=69" not in index or "modules/zero-mandays.css?v=69" not in index:
        fail("Zero Mandays module references are missing from index.html")
    if "document.write(" in index:
        fail("document.write cache-busting is forbidden")
    if "fonts.googleapis.com/css2?family=Inter" not in index:
        fail("Inter Google Fonts stylesheet is missing from index.html")
    if 'id="themeToggleBtn"' not in index or "modules/theme.js?v=69" not in index:
        fail("Manual Light/Dark theme toggle is incomplete")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    if "@media (prefers-color-scheme:dark)" in css:
        fail("Automatic OS dark mode must remain disabled; use manual theme toggle")
    if 'html[data-theme="dark"]' not in css:
        fail("Manual dark theme selectors are missing")
    if "incoming/Daily Report.xlsx" not in (ROOT / ".gitignore").read_text(encoding="utf-8"):
        fail("incoming/Daily Report.xlsx must be ignored")
    if 'src="ongoing-details.js?v=69"' in index:
        fail("ongoing-details.js must be lazy-loaded")
    if "SRDM_ZERO_MANDAYS_TAB_V1_START" in index:
        fail("Old injected Zero Mandays patch block is still embedded in index.html")
    if (ROOT / "index.html").stat().st_size > 2_000_000:
        fail("index.html is still acting as a data bundle (>2 MB)")
    giant_inline = [m for m in re.finditer(r"<script(?:\s[^>]*)?>(.*?)</script>", index, re.S) if len(m.group(1)) > 250_000]
    if giant_inline:
        fail(f"Found {len(giant_inline)} giant inline script blocks in index.html")

    forbidden = [
        "LOGIN_CREDENTIALS.txt", "patch_zero_mandays_v4.py", "official-summary.csv", "sample-data.js",
        "scripts_local/local_auto_update_cloud_v2.py", "legacy/update-paths",
        "index_ZERO_MANDAYS_FINAL.html", "index_BACKUP_BEFORE_MANDAYS_FIX.html",
    ]
    present = [p for p in forbidden if (ROOT / p).exists()]
    if present:
        fail(f"Forbidden generated/credential files present: {present}")

    workflows = list((ROOT / ".github" / "workflows").glob("*.y*ml"))
    if len(workflows) != 1 or workflows[0].name != "dashboard-validation.yml":
        fail(f"Expected exactly one validation workflow, found {[p.name for p in workflows]}")
    wf = workflows[0].read_text(encoding="utf-8")
    if "schedule:" in wf:
        fail("Production GitHub workflow must not scrape on a schedule")

    merge = (ROOT / "scripts" / "merge_official_summary.py").read_text(encoding="utf-8")
    # This temporary business lock is intentionally retained by user request.
    if "ONGOING_LOCK_END = date(2026, 9, 6)" not in merge:
        fail("Required temporary PMAY/Ek Bagiya lock was changed or removed")
    if "if p!=11995 or e!=756" not in merge:
        fail("Required lock verification totals were changed or removed")

    data = load_auto_report()
    official = data.get("official", [])
    daily = data.get("daily", [])
    if len(official) != 8 or len(daily) != 8:
        fail(f"Expected 8 official and 8 daily rows, got {len(official)} and {len(daily)}")
    for label, rows in (("official", official), ("daily", daily)):
        names = {str(r.get("janpad", "")).strip().upper() for r in rows}
        if names != EXPECTED_JANPADS:
            fail(f"{label} Janpads mismatch: {sorted(names)}")

    csv_path = ROOT / "data" / "official-summary.csv"
    with csv_path.open(encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    csv_names = {str(r.get("janpad", "")).strip().upper() for r in rows}
    if csv_names != EXPECTED_JANPADS:
        fail(f"official-summary.csv Janpads mismatch: {sorted(csv_names)}")

    print("Repository validation OK")
    print(f"Build: {EXPECTED_VERSION}")
    print("Workflow: one validation-only GitHub Action")
    print("Zero Mandays: external module")
    print("Temporary PMAY/Ek Bagiya lock: retained through 06-09-2026")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, ValueError, json.JSONDecodeError) as exc:
        print(f"Repository validation FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
