"""
SRDM Satna — Local Daily Auto-Update Script (corrected)

R6.9 portal mapping:
  - ALL: main Screen-2 values
  - Individual: Work Category = Works on Individuals Land (Category IV), Proposed Status = ALL
  - PMAY-G: Work Category = Works on Individuals Land (Category IV),
            Proposed Status = Constr of PMAY-G House for Individuals
  - Ek Bagiya: Work Category = Works on Individuals Land (Category IV),
               Proposed Status = Block Plantation-Hort-Trees in fields-Individuals

For the three category reports, the script reads:
  - Labour = "Maximum Expected Unskilled Labour Engagement as per e-Muster Roll"
  - Muster Rolls = "No. of Muster Rolls (MRs)"
"""

import csv
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
# Works correctly whether this file is kept in repo root or in scripts_local.
ROOT = HERE.parent if HERE.name.lower() == "scripts_local" else HERE

CSV_PATH = ROOT / "data" / "official-summary.csv"
STATUS_JSON = ROOT / "data" / "fetch-status.json"
STATUS_JS = ROOT / "auto-status.js"

REPORT_URL = "https://vbgramgrep.dord.gov.in/VBGRAMG/dpc_sms_new.aspx?payload=c_dCXx6L-IMkcEdlRICw87o-OWrumZUuTOVJCtXMwo49VCcKVJKknrfE_4qO0AT_WQTG3yWM7D1kNUU7DSpTx1H8j3SYUjwu3q4dQX_CfBdu4ni8Iou1EYozxNZb5rwNvD2JMp78Hx-qNCdsq3ux6X1MITBA5uUF3gtds07lUIHnl4ONcwgjtjtzvWYQ0UDGVInRFjvVbtwWWXI7s8-I3jU8QwBBMeYwU7dbbckRQbgR_S8b6XGjuQ6EwEUi4ba3pW06r3n-L-iVwCLbYfyloXs1UzJGGw9YBlOFBm-hlzE"

JANPAD_ORDER = [
    "AMARPATAN", "MAIHAR", "MAJHGAWAN", "NAGOD",
    "RAMNAGAR", "RAMPUR BAGHELAN", "SATNA", "UNCHAHARA"
]

INDIVIDUAL_CATEGORY = "Works on Individuals Land (Category IV)"
PMAY_STATUS = "Constr of PMAY-G House for Individuals"
EK_BAGIYA_STATUS = "Block Plantation-Hort-Trees in fields-Individuals"


def _clean_text(value):
    value = re.sub(r"<[^>]+>", "", value or "")
    value = value.replace("&nbsp;", " ")
    return re.sub(r"\s+", " ", value).strip()


def _number(value):
    s = re.sub(r"[^\d.]", "", _clean_text(value))
    try:
        return float(s) if s else 0.0
    except ValueError:
        return 0.0


def _row_data(html):
    """Return {JANPAD: [numeric cells after the Janpad cell]}."""
    out = {}
    for row_html in re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.I | re.S):
        cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row_html, re.I | re.S)
        clean = [_clean_text(c) for c in cells]
        clean = [c for c in clean if c]

        janpad = None
        janpad_index = None
        for i, cell in enumerate(clean):
            name = cell.upper().strip()
            for j in JANPAD_ORDER:
                if name == j or j in name or name in j:
                    janpad = j
                    janpad_index = i
                    break
            if janpad:
                break

        if not janpad:
            continue

        nums = [_number(c) for c in clean[janpad_index + 1:]]
        if nums:
            out[janpad] = nums

    return out


def parse_all_report(html):
    """
    R6.9 ALL report columns after Blocks:
      Total GP, GP with Works in Progress, Labour,
      Ongoing Works for which MR issued, Workers without e-KYC, No. of MRs.
    """
    rows = _row_data(html)
    data = {}
    for j, nums in rows.items():
        if len(nums) < 6:
            continue
        total_gp = nums[0]
        gp_progress = nums[1]
        data[j] = {
            "totalGP": total_gp,
            "musterGP": gp_progress,
            "dysfunctionalGP": max(0, total_gp - gp_progress),
            "labourAll": nums[2],
            "mrAll": nums[3],       # works for which MR has been issued
            "noEkyc": nums[4],
            "mrs": nums[5],         # actual number of Muster Rolls
        }
    return data


def parse_category_report(html):
    """
    Category report columns after Blocks:
      Total GP, GP with Works in Progress, Labour,
      Ongoing Works for which MR issued, Workers without e-KYC, No. of MRs.
    """
    rows = _row_data(html)
    data = {}
    for j, nums in rows.items():
        if len(nums) < 6:
            continue
        data[j] = {
            "gps": nums[0],
            "gpsProgress": nums[1],
            "labour": nums[2],
            "ongoingMRWorks": nums[3],
            "noEkyc": nums[4],
            "mrs": nums[5],
        }
    return data


def _select_label(select, label):
    """Select a dropdown item by visible label, with a text-match fallback."""
    try:
        select.select_option(label=label)
        return
    except Exception:
        options = select.locator("option").all()
        target = re.sub(r"\s+", " ", label).strip().lower()
        for opt in options:
            txt = re.sub(r"\s+", " ", (opt.inner_text() or "")).strip()
            if txt.lower() == target or target in txt.lower() or txt.lower() in target:
                select.select_option(value=opt.get_attribute("value"))
                return
        raise RuntimeError(f"Dropdown option not found: {label}")


def _submit_and_wait(page):
    try:
        page.get_by_role("button", name=re.compile(r"submit", re.I)).click()
    except Exception:
        page.locator("input[type=submit],button[type=submit]").first.click()
    page.wait_for_load_state("networkidle", timeout=60000)
    page.wait_for_timeout(1200)


def fetch_reports():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/128.0.0.0 Safari/537.36"
            )
        )
        page.goto(REPORT_URL, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(1500)

        selects = page.locator("select")
        if selects.count() < 3:
            browser.close()
            raise RuntimeError("R6.9 filters not found: expected 3 dropdowns.")

        work_category = selects.nth(1)
        proposed_status = selects.nth(2)

        # 1) ALL report
        _select_label(work_category, "ALL")
        _select_label(proposed_status, "ALL")
        _submit_and_wait(page)
        all_html = page.content()

        # 2) Individual
        selects = page.locator("select")
        work_category = selects.nth(1)
        proposed_status = selects.nth(2)
        _select_label(work_category, INDIVIDUAL_CATEGORY)
        _select_label(proposed_status, "ALL")
        _submit_and_wait(page)
        individual_html = page.content()

        # 3) PMAY-G
        selects = page.locator("select")
        work_category = selects.nth(1)
        proposed_status = selects.nth(2)
        _select_label(work_category, INDIVIDUAL_CATEGORY)
        _select_label(proposed_status, PMAY_STATUS)
        _submit_and_wait(page)
        pmay_html = page.content()

        # 4) Ek Bagiya
        selects = page.locator("select")
        work_category = selects.nth(1)
        proposed_status = selects.nth(2)
        _select_label(work_category, INDIVIDUAL_CATEGORY)
        _select_label(proposed_status, EK_BAGIYA_STATUS)
        _submit_and_wait(page)
        ek_html = page.content()

        browser.close()

    return all_html, individual_html, pmay_html, ek_html


def combine_reports(all_html, individual_html, pmay_html, ek_html):
    base = parse_all_report(all_html)
    individual = parse_category_report(individual_html)
    pmay = parse_category_report(pmay_html)
    ek = parse_category_report(ek_html)

    data = {}
    for j in JANPAD_ORDER:
        if j not in base:
            continue
        d = dict(base[j])

        if j in individual:
            d["labourIndividual"] = individual[j]["labour"]
            d["mrIndividual"] = individual[j]["mrs"]

        if j in pmay:
            d["pmayLabour"] = pmay[j]["labour"]
            d["pmayOngoing"] = pmay[j]["ongoingMRWorks"]
            d["pmayMR"] = pmay[j]["mrs"]

        if j in ek:
            d["ekLabour"] = ek[j]["labour"]
            d["ekOngoing"] = ek[j]["ongoingMRWorks"]
            d["ekMR"] = ek[j]["mrs"]

        data[j] = d

    return data


def update_csv(new_data):
    rows = []
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    # pmayLabour is needed by the corrected dashboard mapping.
    required = [
        "totalGP", "musterGP", "dysfunctionalGP",
        "labourAll", "mrAll", "noEkyc", "mrs",
        "labourIndividual", "mrIndividual",
        "pmayLabour", "pmayOngoing", "pmayMR",
        "ekLabour", "ekOngoing", "ekMR",
    ]
    for name in required:
        if name not in fieldnames:
            fieldnames.append(name)

    for r in rows:
        j = (r.get("janpad") or "").strip().upper()
        if j not in new_data:
            continue
        d = new_data[j]
        for key in required:
            if key in d:
                r[key] = str(int(round(d[key])))

    with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"Updated {CSV_PATH} for {len(new_data)} janpads")


def update_status(ok, note):
    today = datetime.now().strftime("%d-%m-%Y")
    status = {
        "startedAt": datetime.now(timezone.utc).isoformat(),
        "ok": ok,
        "source": "Official VB-G RAM G R6.9 (local PC fetch)",
        "steps": [{"step": "R6.9 category fetch", "ok": ok, "detail": note}],
        "officialDate": today,
        "note": note,
        "finishedAt": datetime.now(timezone.utc).isoformat(),
    }
    STATUS_JSON.parent.mkdir(parents=True, exist_ok=True)
    STATUS_JSON.write_text(
        json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    STATUS_JS.write_text(
        "window.AUTO_FETCH_STATUS=" +
        json.dumps(status, ensure_ascii=False, separators=(",", ":")) +
        ";\n",
        encoding="utf-8",
    )


def main():
    try:
        all_html, individual_html, pmay_html, ek_html = fetch_reports()
        data = combine_reports(all_html, individual_html, pmay_html, ek_html)

        if len(data) < 8:
            raise RuntimeError(
                f"Only {len(data)}/8 Janpads parsed. Existing CSV was not changed."
            )

        update_csv(data)

        # Print totals as a quick validation against the portal screenshots.
        ind_lab = sum(d.get("labourIndividual", 0) for d in data.values())
        ind_mr = sum(d.get("mrIndividual", 0) for d in data.values())
        pmay_lab = sum(d.get("pmayLabour", 0) for d in data.values())
        pmay_mr = sum(d.get("pmayMR", 0) for d in data.values())
        ek_lab = sum(d.get("ekLabour", 0) for d in data.values())
        ek_mr = sum(d.get("ekMR", 0) for d in data.values())

        note = (
            f"8/8 Janpads. "
            f"Individual Labour/MR={int(ind_lab)}/{int(ind_mr)}; "
            f"PMAY Labour/MR={int(pmay_lab)}/{int(pmay_mr)}; "
            f"Ek Bagiya Labour/MR={int(ek_lab)}/{int(ek_mr)}."
        )
        update_status(True, note)
        print("SUCCESS:", note)
        print("Next: python scripts\\merge_official_summary.py")

    except Exception as e:
        print(f"FAILED: {e}")
        update_status(False, str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
