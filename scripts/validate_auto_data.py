#!/usr/bin/env python3
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'auto-data.js'
s=p.read_text(encoding='utf-8')
m=re.search(r'window.AUTO_REPORT=(.*);\s*$',s,re.S)
if not m: raise SystemExit('AUTO_REPORT not found')
d=json.loads(m.group(1)); meta=d.get('meta',{})
rows=d.get('rows',[]); daily=d.get('daily',[]); official=d.get('official',[])
if not rows or not daily or not official: raise SystemExit('Missing rows/daily/official data')

def sm(a,k): return sum(float(x.get(k) or 0) for x in a)
gp=sm(daily,'totalGP'); prog=sm(daily,'gpsProgress'); mr=sm(daily,'worksMR'); mrs=sm(daily,'mrs'); labour=sm(daily,'labour')
if gp < 600 or gp > 800: raise SystemExit(f'Total GP out of safe range: {gp}')
if not (0 <= prog <= gp): raise SystemExit('GP progress invalid')
if mr <= 0: raise SystemExit('Works with MR is zero — reject publish')
if mrs <= 0: raise SystemExit('Muster Rolls is zero — reject publish')
if labour <= 0: raise SystemExit('Labour Engagement is zero — reject publish')
if sm(official,'ongoingAll') <= 0: raise SystemExit('Official ongoing works is zero')

# V49 safety lock: when official-summary.csv exists, published shared KPIs must match it EXACTLY.
csvp=ROOT/'data'/'official-summary.csv'
if csvp.exists():
    import csv
    with csvp.open(encoding='utf-8-sig',newline='') as f:
        sr=list(csv.DictReader(f))
    if len(sr)==8:
        checks=[('totalGP','totalGP'),('musterGP','gpsProgress'),('labourAll','labour'),('mrAll','worksMR'),('noEkyc','noEkyc'),('mrs','mrs')]
        om={str(r.get('janpad','')).strip().upper():r for r in official}
        dm={str(r.get('janpad','')).strip().upper():r for r in daily}
        for r in sr:
            j=str(r.get('janpad','')).strip().upper()
            if j not in om or j not in dm: raise SystemExit(f'Published Janpad missing: {j}')
            for csvk,autok in checks:
                target=float(r.get(csvk) or 0)
                actual=float((dm[j] if autok in ('totalGP','gpsProgress','labour','worksMR','noEkyc','mrs') else om[j]).get(autok) or 0)
                if abs(target-actual)>0.001:
                    raise SystemExit(f'LIVE PORTAL mismatch {j} {autok}: portal={target}, published={actual}')

print(json.dumps({'gp':gp,'progress':prog,'dysfunctional':gp-prog,'worksMR':mr,'musterRolls':mrs,'labour':labour,'officialOngoing':sm(official,'ongoingAll'),'source':meta.get('source')},ensure_ascii=False,indent=2))
