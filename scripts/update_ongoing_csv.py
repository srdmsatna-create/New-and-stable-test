#!/usr/bin/env python3
"""Convert the latest official dynamic_work_details CSV into portal JS.

The official CSV contains work-level data but not Engineer/Cluster. Those fields are
joined from AUTO_REPORT rows by Janpad + Panchayat, with the previous ongoing JS as
an additional fallback. This lets the work-level screen refresh automatically
without requiring a manual Daily Report.xlsx upload.
"""
import csv, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
CSV_PATH = DATA / 'Ongoing_Works_dynamic_work_details_latest.csv'
AUTO = ROOT / 'auto-data.js'
OUT = ROOT / 'ongoing-details.js'


def clean(v):
    return '' if v is None else str(v).strip()

def num(v):
    try:
        return float(str(v).replace(',', '').strip() or 0)
    except Exception:
        return 0.0

def norm(v):
    return re.sub(r'\s+', ' ', clean(v)).strip().upper()

def norm_janpad(v):
    x = norm(v)
    return 'SATNA' if x == 'SOHAWAL' else x

def load_js_json(path, prefix):
    s = path.read_text(encoding='utf-8').strip()
    s = re.sub(r'^' + re.escape(prefix) + r'\s*=\s*', '', s).rstrip(';')
    return json.loads(s)

def build_mapping():
    mapping = {}
    if AUTO.exists():
        try:
            data = load_js_json(AUTO, 'window.AUTO_REPORT')
            for r in data.get('rows', []):
                j = norm_janpad(r.get('janpad'))
                gp = norm(r.get('panchayat'))
                if j and gp:
                    mapping[(j, gp)] = (clean(r.get('engineer')), clean(r.get('cluster')))
        except Exception as e:
            print('WARN auto-data mapping:', e)
    # Preserve old mapping where RepDay lacks a row.
    if OUT.exists():
        try:
            old = load_js_json(OUT, 'window.ONGOING_DETAILS')
            for r in old:
                key = (norm_janpad(r.get('janpad')), norm(r.get('panchayat')))
                mapping.setdefault(key, (clean(r.get('engineer')), clean(r.get('cluster'))))
        except Exception as e:
            print('WARN previous ongoing mapping:', e)
    return mapping

def main():
    if not CSV_PATH.exists():
        raise SystemExit(f'Missing latest ongoing CSV: {CSV_PATH}')
    mp = build_mapping()
    rows = []
    with CSV_PATH.open('r', encoding='utf-8-sig', newline='') as f:
        rd = csv.DictReader(f)
        required = {'Janpad / Block Name','Panchayat Name','Work Code','Work Name','Work Status'}
        if not required.issubset(set(rd.fieldnames or [])):
            raise SystemExit('Official ongoing CSV missing expected headers')
        for i, r in enumerate(rd, 1):
            if norm(r.get('Work Status')) and norm(r.get('Work Status')) != 'ONGOING':
                continue
            j = norm_janpad(r.get('Janpad / Block Name'))
            gp = clean(r.get('Panchayat Name'))
            eng, clu = mp.get((j, norm(gp)), ('', ''))
            sanction = num(r.get('Total Sanction (Rs)'))
            booked = num(r.get('Booked Since Inception Wages (Rs)')) + num(r.get('Booked Since Inception Material (Rs)'))
            rows.append({
                'sno': len(rows)+1,
                'district': clean(r.get('District Name')),
                'janpad': j,
                'engineer': eng,
                'cluster': clu,
                'panchayat': gp,
                'fy': clean(r.get('Work Start Fin Year')),
                'status': clean(r.get('Work Status')),
                'code': clean(r.get('Work Code')),
                'name': clean(r.get('Work Name')),
                'type': clean(r.get('Work Type')),
                'sanction': sanction,
                'booked': booked,
                'expPct': (booked * 100 / sanction) if sanction else 0.0,
                'mandays': num(r.get('Total Mandays')),
                'currentFYMandays': num(r.get('Mandays Generated Current FY')),
            })
    if not rows:
        raise SystemExit('Official ongoing CSV produced zero rows; refusing to overwrite previous data')
    OUT.write_text('window.ONGOING_DETAILS=' + json.dumps(rows, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    mapped = sum(1 for r in rows if r['engineer'])
    print(f'Updated ongoing-details.js: {len(rows)} works; engineer mapping {mapped}/{len(rows)}')

if __name__ == '__main__':
    main()
