#!/usr/bin/env python3
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
st=json.loads((ROOT/'data'/'fetch-status.json').read_text(encoding='utf-8'))
mode=st.get('updateMode')

def run(script):
    return subprocess.call([sys.executable,str(ROOT/'scripts'/script)],cwd=ROOT)

print('Applying official update mode:',mode)
if mode=='workbook':
    rc=run('update_daily_report.py')
elif mode=='summary':
    rc=run('merge_official_summary.py')
elif mode=='workbook+summary':
    rc=run('update_daily_report.py')
    if not rc:
        # Critical: live portal Screen-2 always runs LAST and therefore wins.
        rc=run('merge_official_summary.py')
else:
    raise SystemExit('No valid updateMode from official fetch')
if rc:
    raise SystemExit(rc)

# V50 work-level Ongoing refresh is independent of the Daily Report workbook.
if st.get('ongoingCsv'):
    rc=run('update_ongoing_csv.py')
    if rc:
        raise SystemExit(rc)
