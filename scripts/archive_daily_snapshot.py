from pathlib import Path
import csv,re,json
ROOT=Path(__file__).resolve().parents[1]; src=ROOT/'data/official-summary.csv'; out=ROOT/'data/history/summary-history.csv'; out.parent.mkdir(parents=True,exist_ok=True)
def date_value():
 t=(ROOT/'auto-data.js').read_text(encoding='utf-8'); t=re.sub(r'^window\.AUTO_REPORT\s*=\s*','',t.strip()).rstrip(';'); d=json.loads(t); x=(d.get('meta',{}).get('sourceDates',{}).get('OfficialSummary') or '')
 m=re.match(r'(\d{2})-(\d{2})-(\d{4})',x); return f'{m.group(3)}-{m.group(2)}-{m.group(1)}' if m else __import__('datetime').date.today().isoformat()
fields=['date','janpad','totalGP','musterGP','dysfunctionalGP','labourAll','mrAll','ongoingAll','pmayOngoing','ekOngoing']
with src.open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f)); d=date_value(); new=[{k:(d if k=='date' else r.get(k,'')) for k in fields} for r in rows]
old=[]
if out.exists():
 with out.open(encoding='utf-8-sig',newline='') as f: old=list(csv.DictReader(f))
keys={(r['date'],r['janpad']) for r in new}; old=[r for r in old if (r.get('date'),r.get('janpad')) not in keys]+new; old.sort(key=lambda r:(r['date'],r['janpad']))
with out.open('w',encoding='utf-8-sig',newline='') as f: w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(old)
print(f'History snapshot archived: {d} ({len(new)} Janpads)')
