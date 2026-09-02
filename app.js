/* Embedded app.js - CATEGORY SYNC V8 */
const MAIHAR=new Set(['AMARPATAN','MAIHAR','RAMNAGAR']);const SATNA=new Set(['MAJHGAWAN','NAGOD','RAMPUR BAGHELAN','SOHAWAL','SATNA','UNCHAHARA']);
const JANPAD_PORTAL=[{district:'MAIHAR',janpad:'AMARPATAN',label:'अमरपाटन'},{district:'MAIHAR',janpad:'MAIHAR',label:'मैहर'},{district:'MAIHAR',janpad:'RAMNAGAR',label:'रामनगर'},{district:'SATNA',janpad:'MAJHGAWAN',label:'मझगवां'},{district:'SATNA',janpad:'NAGOD',label:'नागौद'},{district:'SATNA',janpad:'RAMPUR BAGHELAN',label:'रामपुर बघेलान'},{district:'SATNA',janpad:'SATNA',label:'सतना / सोहावल'},{district:'SATNA',janpad:'UNCHAHARA',label:'उचेहरा'}];
const BOOT_REPORT=window.AUTO_REPORT||window.SAMPLE_REPORT||{};
let rows=BOOT_REPORT.rows||[],official=BOOT_REPORT.official||[],daily=BOOT_REPORT.daily||[],workmix=BOOT_REPORT.workmix||[],categorymix=BOOT_REPORT.categorymix||[],ongoingDetails=[],reportTitle=BOOT_REPORT.title||'',pendingFile=null,view='dysjanpad',lastExport=[];

const ONGOING_HEAVY_VIEWS=new Set(['ekbagiya','ongoingall','ongoingdetails','category','categorysubeng','categoryworks','expbucket','recovery']);
let ongoingDetailsPromise=null;
function ensureOngoingDetails(){
  if(ongoingDetails.length)return Promise.resolve(ongoingDetails);
  if(window.ONGOING_DETAILS?.length){ongoingDetails=window.ONGOING_DETAILS;return Promise.resolve(ongoingDetails);}
  if(ongoingDetailsPromise)return ongoingDetailsPromise;
  ongoingDetailsPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='ongoing-details.js?v=69';s.async=true;s.onload=()=>{ongoingDetails=window.ONGOING_DETAILS||[];try{if(ongoingDetails.length)rebuildCorrectedWorkData();refreshFilters();}catch(e){}resolve(ongoingDetails)};s.onerror=()=>{ongoingDetailsPromise=null;reject(new Error('Work-level data load failed'))};document.head.appendChild(s)});
  return ongoingDetailsPromise;
}
window.ensureOngoingDetails=ensureOngoingDetails;

let autoMeta=BOOT_REPORT.meta||{mode:(window.AUTO_REPORT?'auto':'sample'),updatedAt:null,source:null,status:(window.AUTO_REPORT?'ok':'sample')};
const $=id=>document.getElementById(id),num=x=>Number(x)||0,clean=x=>String(x??'').trim(),fmt=n=>new Intl.NumberFormat('en-IN').format(Math.round(num(n))),pct=(a,b)=>b?(num(a)*100/num(b)):0,esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const normJanpad=v=>{const j=clean(v).toUpperCase();return j==='SOHAWAL'?'SATNA':j};
function districtOf(j){j=clean(j).toUpperCase();return MAIHAR.has(j)?'MAIHAR':SATNA.has(j)?'SATNA':'OTHER'}function extractDate(t){const m=String(t).match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);return m?`${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}-${m[3]}`:''}function todayDate(){const d=new Date();return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`}
function updateAutoStatus(){const el=$('autoStatus');if(!el)return;const mode=autoMeta?.mode||'sample';const when=autoMeta?.updatedAt?new Date(autoMeta.updatedAt).toLocaleString('hi-IN'):'';const source=autoMeta?.source||'Bundled sample data';const fetchStatus=window.AUTO_FETCH_STATUS||{};const ok=autoMeta?.status==='ok';const sd=autoMeta?.sourceDates||{};const ds=[sd.Sheet1?`Sheet1: ${sd.Sheet1}`:'',sd.RepDay?`RepDay: ${sd.RepDay}`:'',sd.OfficialSummary?`Official: ${sd.OfficialSummary}`:''].filter(Boolean).join(' • ');const changed=autoMeta?.dataChangedOnLastFetch;let stale='';try{const vals=[sd.Sheet1,sd.RepDay,sd.OfficialSummary].filter(Boolean).map(x=>{const m=String(x).match(/(\d{1,2})-(\d{1,2})-(\d{4})/);return m?new Date(+m[3],+m[2]-1,+m[1]):null}).filter(Boolean);if(vals.length){const newest=new Date(Math.max(...vals));const age=Math.floor((Date.now()-newest.getTime())/86400000);if(age>=1)stale=` | ⚠️ STALE DATA: ${age} day old`;}}catch(e){}const changeMsg=changed===false?' | No new values fetched':changed===true?' | Fresh values changed':'';el.innerHTML=`<span class="status-pill ${ok?'ok':'sample'}">${ok?'AUTO DATA':'SAMPLE / MANUAL'}</span><b>${ok?'Last actual data change':'Current mode'}:</b> ${ok?esc(when):esc(mode)} <span class="status-source">${esc(source)}</span>${changeMsg?` <span class="status-source">${esc(changeMsg)}</span>`:''}${stale?` <span class="status-source"><b>${esc(stale)}</b></span>`:''}${ds?` <span class="status-source">| Data date: ${esc(ds)}</span>`:''}${fetchStatus.finishedAt?` <span class="status-source">| Source checked: ${fetchStatus.ok?'✅':'⚠️'} ${esc(new Date(fetchStatus.finishedAt).toLocaleString('hi-IN'))}</span>`:''}`;}
function sum(a,k){return a.reduce((s,r)=>s+num(r[k]),0)}
function sortRows(data, defaultMetric='ongoing', nameKeys=['janpad','district','engineer']){
  const metric=($('sortMetric')?.value||'AUTO')==='AUTO'?defaultMetric:$('sortMetric').value;
  const order=$('sortOrder')?.value||'DESC';
  const a=[...data];
  const nameOf=r=>nameKeys.map(k=>clean(r[k])).find(Boolean)||'';
  if(order==='NAME')return a.sort((x,y)=>nameOf(x).localeCompare(nameOf(y),'hi'));
  return a.sort((x,y)=>{const xv=num(x[metric]),yv=num(y[metric]);const d=order==='ASC'?xv-yv:yv-xv;return d||nameOf(x).localeCompare(nameOf(y),'hi');});
}
function filterRows(a){const d=$('districtFilter').value,j=$('janpadFilter').value,e=$('engineerFilter').value,c=$('clusterFilter').value;return a.filter(r=>(d==='ALL'||districtOf(r.janpad)===d)&&(j==='ALL'||r.janpad===j)&&(e==='ALL'||!r.engineer||r.engineer===e)&&(c==='ALL'||!r.cluster||r.cluster===c))}
function optionize(el,values,label){const cur=el.value;el.innerHTML=`<option value="ALL">${label}</option>`+[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'hi')).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');if([...el.options].some(o=>o.value===cur))el.value=cur}
function refreshFilters(){let b=rows;if($('districtFilter').value!=='ALL')b=b.filter(r=>districtOf(r.janpad)===$('districtFilter').value);optionize($('janpadFilter'),b.map(r=>r.janpad),'सभी Janpad');if($('janpadFilter').value!=='ALL')b=b.filter(r=>r.janpad===$('janpadFilter').value);optionize($('engineerFilter'),b.map(r=>r.engineer),'सभी Engineer');if($('engineerFilter').value!=='ALL')b=b.filter(r=>r.engineer===$('engineerFilter').value);optionize($('clusterFilter'),b.map(r=>r.cluster),'सभी Cluster');const cf=$('categoryFilter');if(cf){let w=ongoingDetails;if($('districtFilter').value!=='ALL')w=w.filter(r=>districtOf(r.janpad)===$('districtFilter').value);if($('janpadFilter').value!=='ALL')w=w.filter(r=>r.janpad===$('janpadFilter').value);if($('engineerFilter').value!=='ALL')w=w.filter(r=>r.engineer===$('engineerFilter').value);if($('clusterFilter').value!=='ALL')w=w.filter(r=>r.cluster===$('clusterFilter').value);optionize(cf,w.map(r=>clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy)),'सभी Work Category')}}
function filteredRows(){return filterRows(rows)}
function dailyFiltered(){let a=daily;if($('districtFilter').value!=='ALL')a=a.filter(r=>districtOf(r.janpad)===$('districtFilter').value);if($('janpadFilter').value!=='ALL')a=a.filter(r=>r.janpad===$('janpadFilter').value);return a}
function kpis(list){const broadFilters=$('engineerFilter').value==='ALL'&&$('clusterFilter').value==='ALL';if(broadFilters&&daily.length){const dd=dailyFiltered(),oo=officialFiltered(),gps=sum(dd,'totalGP'),prog=sum(dd,'gpsProgress'),mr=sum(dd,'worksMR'),labour=sum(dd,'labour'),mrs=sum(dd,'mrs'),ongoing=sum(oo,'ongoingAll');$('kpis').innerHTML=[['Gram Panchayats',gps,'Total GP'],['GPs with Progress',prog,`${pct(prog,gps).toFixed(1)}% coverage`],['Dysfunctional GP',Math.max(0,gps-prog),`${pct(Math.max(0,gps-prog),gps).toFixed(1)}% of GP`],['Ongoing Works',ongoing,'Official Sheet1'],['Works with MR',mr,'Screen 2 / Sheet1'],['Labour Engagement',labour,'Screen 2 / Sheet1'],['Muster Rolls',mrs,'Screen 2 / Sheet1']].map(x=>`<div class="kpi"><small>${x[0]}</small><strong>${fmt(x[1])}</strong><em>${x[2]}</em></div>`).join('');return}const gps=sum(list,'gps'),prog=sum(list,'gpsProgress'),ongoing=sum(list,'ongoing'),mr=sum(list,'worksMR'),labour=sum(list,'labour'),mrs=sum(list,'mrs');$('kpis').innerHTML=[['Gram Panchayats',gps,'Total GP'],['GPs with Progress',prog,`${pct(prog,gps).toFixed(1)}% coverage`],['Dysfunctional GP',Math.max(0,gps-prog),`${pct(Math.max(0,gps-prog),gps).toFixed(1)}% of GP`],['Ongoing Works',ongoing,'Work load'],['Works with MR',mr,`${pct(mr,ongoing).toFixed(1)}% of ongoing`],['Labour Engagement',labour,'e-Muster based'],['Muster Rolls',mrs,'MR count']].map(x=>`<div class="kpi"><small>${x[0]}</small><strong>${fmt(x[1])}</strong><em>${x[2]}</em></div>`).join('')}
function aggregate(a,keys,metrics){const m=new Map();for(const r of a){const id=keys.map(k=>clean(r[k])).join('¦');if(!m.has(id)){const z={};keys.forEach(k=>z[k]=clean(r[k]));metrics.forEach(k=>z[k]=0);m.set(id,z)}const z=m.get(id);metrics.forEach(k=>z[k]+=num(r[k]))}return [...m.values()]}
function mixMap(){const m=new Map();for(const r of workmix){const k=[r.janpad,r.engineer,r.cluster,r.panchayat].map(clean).join('¦');m.set(k,r)}return m}
function apportionExact(group,key,target,fallbackKey='gps'){target=Math.max(0,Math.round(num(target)));if(!group.length)return;const vals=group.map(r=>Math.max(0,num(r[key]))),sumv=vals.reduce((a,b)=>a+b,0);let weights=vals;if(sumv<=0){weights=group.map(r=>Math.max(0,num(r[fallbackKey])));if(weights.reduce((a,b)=>a+b,0)<=0)weights=group.map(()=>1)}const sw=weights.reduce((a,b)=>a+b,0)||1;const raw=weights.map(w=>target*w/sw),base=raw.map(Math.floor);let left=target-base.reduce((a,b)=>a+b,0);const order=raw.map((v,i)=>({i,frac:v-base[i],name:clean(group[i].engineer)})).sort((a,b)=>b.frac-a.frac||a.name.localeCompare(b.name,'hi'));for(let n=0;n<left;n++)base[order[n%order.length].i]++;group.forEach((r,i)=>r[key]=base[i])}
function engineerData(list){const mm=mixMap();const enriched=list.map(r=>{const x=mm.get([r.janpad,r.engineer,r.cluster,r.panchayat].map(clean).join('¦'))||{};return {...r,pmayOngoing:num(x.pmayOngoing),ekOngoing:num(x.ekOngoing),currentFYActive:num(x.currentFYActive)}});const metrics=['gps','gpsProgress','ongoing','worksMR','labour','mrs','noEkyc','pmayOngoing','ekOngoing','currentFYActive'];const out=aggregate(enriched,['janpad','engineer'],metrics);const cm=new Map();for(const r of enriched){const k=[clean(r.janpad),clean(r.engineer)].join('¦');if(!cm.has(k))cm.set(k,new Set());if(clean(r.cluster))cm.get(k).add(clean(r.cluster));}for(const r of out){const k=[clean(r.janpad),clean(r.engineer)].join('¦');r.cluster=[...(cm.get(k)||[])].sort((a,b)=>a.localeCompare(b,'hi')).join(', ');r.gpsRaw=r.gps;r.gpsProgressRaw=r.gpsProgress;r.ongoingRaw=r.ongoing;r.worksMRRaw=r.worksMR;r.labourRaw=r.labour;r.mrsRaw=r.mrs;}/* Reconcile Engineer-wise daily columns to official Janpad totals while keeping GP Progress <= GP. */const dmap=new Map(daily.map(r=>[normJanpad(r.janpad),r])),omap=new Map(official.map(r=>[normJanpad(r.janpad),r]));for(const j of [...new Set(out.map(r=>normJanpad(r.janpad)))]){const g=out.filter(r=>normJanpad(r.janpad)===j),d=dmap.get(j)||{},o=omap.get(j)||{};apportionExact(g,'gps',d.totalGP,'gpsRaw');apportionCappedExact(g,'gpsProgress',d.gpsProgress,'gpsProgressRaw','gps');apportionExact(g,'labour',d.labour,'labourRaw');apportionExact(g,'worksMR',d.worksMR,'worksMRRaw');apportionExact(g,'mrs',d.mrs,'mrsRaw');apportionExact(g,'ongoing',o.ongoingAll,'ongoingRaw');for(const r of g)r.dysfunctionalGP=Math.max(0,num(r.gps)-num(r.gpsProgress));}return out}
function engineerOfficialData(list){
  const out=engineerData(list).map(r=>({...r,district:districtOf(r.janpad),totalGP:r.gps,musterGP:r.gpsProgress,labourAll:r.labour,mrAll:r.worksMR,ongoingAll:r.ongoing}));
  const omap=new Map(official.map(r=>[normJanpad(r.janpad),r]));
  for(const j of [...new Set(out.map(r=>normJanpad(r.janpad)))]){
    const g=out.filter(r=>normJanpad(r.janpad)===j),o=omap.get(j)||{};
    g.forEach(r=>{r.noEkycRaw=num(r.noEkyc);r.pmayOngoingRaw=num(r.pmayOngoing);r.ekOngoingRaw=num(r.ekOngoing);r.labourIndividual=0;r.mrIndividual=0;r.labourCommunity=0;r.mrCommunity=0;r.pmayMR=0;r.ekLabour=0;r.ekMR=0;});
    apportionExact(g,'noEkyc',o.noEkyc,'noEkycRaw');
    apportionExact(g,'labourIndividual',o.labourIndividual,'labourAll');
    apportionExact(g,'mrIndividual',o.mrIndividual,'mrAll');
    apportionExact(g,'labourCommunity',o.labourCommunity,'labourAll');
    apportionExact(g,'mrCommunity',o.mrCommunity,'mrAll');
    apportionExact(g,'pmayOngoing',o.pmayOngoing,'pmayOngoingRaw');
    apportionExact(g,'pmayMR',o.pmayMR,'pmayOngoing');
    apportionExact(g,'ekOngoing',o.ekOngoing,'ekOngoingRaw');
    apportionExact(g,'ekLabour',o.ekLabour,'ekOngoing');
    apportionExact(g,'ekMR',o.ekMR,'ekOngoing');
  }
  return out;
}
function coverageBadgeText(worksMR,ongoing){return `${pct(worksMR,ongoing).toFixed(1)}%`}
function apportionCappedExact(group,key,target,weightKey,maxKey){
  target=Math.max(0,Math.round(num(target)));if(!group.length)return;
  const caps=group.map(r=>Math.max(0,Math.round(num(r[maxKey]))));
  target=Math.min(target,caps.reduce((a,b)=>a+b,0));
  let weights=group.map(r=>Math.max(0,num(r[weightKey])));
  if(weights.reduce((a,b)=>a+b,0)<=0){weights=group.map(r=>Math.max(0,num(r[maxKey])-num(r.gpsProgressRaw||0)));}
  if(weights.reduce((a,b)=>a+b,0)<=0)weights=group.map(r=>Math.max(0,num(r[maxKey])));
  if(weights.reduce((a,b)=>a+b,0)<=0)weights=group.map(()=>1);
  const out=group.map(()=>0);let remaining=target;
  while(remaining>0){
    const eligible=group.map((r,i)=>i).filter(i=>out[i]<caps[i]);if(!eligible.length)break;
    const sw=eligible.reduce((a,i)=>a+weights[i],0)||eligible.length;
    const raw=eligible.map(i=>({i,v:remaining*((weights[i]||1)/sw)}));
    let placed=0;
    for(const q of raw){const room=caps[q.i]-out[q.i],add=Math.min(room,Math.floor(q.v));if(add>0){out[q.i]+=add;placed+=add;}}
    remaining-=placed;if(remaining<=0)break;
    const order=raw.map(q=>({i:q.i,frac:q.v-Math.floor(q.v),w:weights[q.i],name:clean(group[q.i].engineer)})).filter(q=>out[q.i]<caps[q.i]).sort((a,b)=>b.frac-a.frac||b.w-a.w||a.name.localeCompare(b.name,'hi'));
    if(!order.length)break;
    for(const q of order){if(remaining<=0)break;if(out[q.i]<caps[q.i]){out[q.i]++;remaining--;}}
  }
  group.forEach((r,i)=>r[key]=out[i]);
}
function dysfunctionalEngineerData(list){
  /* Exact engineer-wise Dysfunctional GP logic:
     - A GP is dysfunctional when its RepDay GP Progress is 0.
     - Engineer count is the ACTUAL count of those GP rows; no apportionment.
     - Janpad Official Dys GP remains visible as a validation total.
     - Each engineer row carries the exact dysfunctional GP names with that GP's
       Ongoing Works and MR Issued values. */
  const base=aggregate(list,['janpad','engineer'],['gps','gpsProgress','ongoing','worksMR','labour','mrs']);
  const cm=new Map(),detailMap=new Map();
  for(const r of list){
    const k=[clean(r.janpad),clean(r.engineer)].join('¦');
    if(!cm.has(k))cm.set(k,new Set());
    if(clean(r.cluster))cm.get(k).add(clean(r.cluster));
    if(num(r.gps)>0 && num(r.gpsProgress)<=0){
      if(!detailMap.has(k))detailMap.set(k,[]);
      detailMap.get(k).push({
        panchayat:clean(r.panchayat),
        ongoing:Math.round(num(r.ongoing)),
        worksMR:Math.round(num(r.worksMR)),
        mrs:Math.round(num(r.mrs)),
        labour:Math.round(num(r.labour))
      });
    }
  }
  const officialEng=engineerData(list);const em=new Map(officialEng.map(r=>[[clean(r.janpad),clean(r.engineer)].join('¦'),r]));
  const out=[];const janpads=[...new Set(base.map(r=>clean(r.janpad)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'hi'));
  for(const janpad of janpads){
    const group=base.filter(r=>clean(r.janpad)===janpad);
    const off=official.find(r=>normJanpad(r.janpad)===normJanpad(janpad));
    const janpadOfficial=off?num(off.dysfunctionalGP):0;
    const janpadActual=group.reduce((a,r)=>a+(detailMap.get([clean(r.janpad),clean(r.engineer)].join('¦'))||[]).length,0);
    for(const r of group){
      const k=[clean(r.janpad),clean(r.engineer)].join('¦');
      r.cluster=[...(cm.get(k)||[])].sort((a,b)=>a.localeCompare(b,'hi')).join(', ');
      r.dysGpRows=(detailMap.get(k)||[]).sort((a,b)=>clean(a.panchayat).localeCompare(clean(b.panchayat),'en'));
      r.dysfunctionalGP=r.dysGpRows.length;
      r.gpsProgress=Math.max(0,num(r.gps)-num(r.dysfunctionalGP));
      const e=em.get(k)||{};
      r.ongoing=num(e.ongoing);r.worksMR=num(e.worksMR);r.labour=num(e.labour);r.mrs=num(e.mrs);
      r.totalJanpadDys=janpadOfficial||janpadActual;
      r.actualJanpadDys=janpadActual;
      r.dysGpDetails=r.dysGpRows.map(x=>`${x.panchayat} (Ongoing ${x.ongoing}, MR Issued ${x.worksMR})`).join('; ');
    }
    group.sort((a,b)=>num(b.dysfunctionalGP)-num(a.dysfunctionalGP)||clean(a.engineer).localeCompare(clean(b.engineer),'hi'));
    group.forEach((r,i)=>out.push({...r,rank:i+1}));
  }
  return out;
}
function dysGpDetailsHtml(r){
  const a=r.dysGpRows||[];
  if(!a.length)return '<span class="muted"></span>';
  return `<div class="dys-gp-details">${a.map(x=>`<div class="dys-gp-item"><b>${esc(x.panchayat)}</b><span>Ongoing: ${fmt(x.ongoing)}</span><span>MR Issued: ${fmt(x.worksMR)}</span></div>`).join('')}</div>`;
}
function alertInsights(list){
  const eng=engineerData(list).filter(r=>num(r.ongoing)>0);
  const janpads=[...new Set(eng.map(r=>clean(r.janpad)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'hi'));
  const lowByJanpad=[];
  for(const janpad of janpads){
    const je=eng.filter(r=>clean(r.janpad)===janpad)
      .sort((a,b)=>pct(a.worksMR,a.ongoing)-pct(b.worksMR,b.ongoing)||num(b.ongoing)-num(a.ongoing)||clean(a.engineer).localeCompare(clean(b.engineer),'hi'))
      .slice(0,3);
    if(je.length)lowByJanpad.push({janpad,items:je});
  }
  const allDys=dysfunctionalEngineerData(list),dysByJanpad=[];
  for(const janpad of [...new Set(allDys.map(r=>r.janpad))]){
    const all=allDys.filter(r=>r.janpad===janpad),items=all.filter(r=>num(r.dysfunctionalGP)>0).slice(0,3);
    if(items.length)dysByJanpad.push({janpad,items,totalDys:all.length?all[0].totalJanpadDys:0});
  }
  return {lowByJanpad,dysByJanpad};
}

function districtHighestDysfunctionalHtml(){
  const off=officialFiltered();
  const source=(off&&off.length?off.map(r=>({
    janpad:r.janpad,
    totalGP:num(r.totalGP),
    gpProgress:Math.max(0,num(r.totalGP)-num(r.dysfunctionalGP)),
    dysfunctionalGP:num(r.dysfunctionalGP)
  })):dailyFiltered().map(r=>({
    janpad:r.janpad,
    totalGP:num(r.totalGP),
    gpProgress:num(r.gpsProgress),
    dysfunctionalGP:Math.max(0,num(r.totalGP)-num(r.gpsProgress))
  }))).map(r=>({...r,district:districtOf(r.janpad)}))
    .filter(r=>r.district==='SATNA'||r.district==='MAIHAR');

  const rows=[];
  for(const district of ['SATNA','MAIHAR']){
    const group=source.filter(r=>r.district===district)
      .sort((a,b)=>num(b.dysfunctionalGP)-num(a.dysfunctionalGP)||clean(a.janpad).localeCompare(clean(b.janpad),'hi'));
    group.slice(0,3).forEach((r,i)=>{
      rows.push(`<tr class="${i===0?'district-top-row':''}">
        <td><b>${esc(district)}</b></td>
        <td class="rank-cell">${i+1}</td>
        <td><b>${esc(r.janpad)}</b></td>
        <td>${fmt(r.totalGP)}</td>
        <td>${fmt(r.gpProgress)}</td>
        <td class="dys-count">${fmt(r.dysfunctionalGP)}</td>
        <td>${pct(r.dysfunctionalGP,r.totalGP).toFixed(1)}%</td>
      </tr>`);
    });
  }
  if(!rows.length)return `<div class="empty-alert">District-wise data उपलब्ध नहीं है।</div>`;
  return `<div class="district-dys-summary">
    <div class="district-dys-note"><b>Top 3 Janpad per District</b><span>सबसे अधिक Dysfunctional GP पहले</span></div>
    <div class="alert-table-wrap district-dys-wrap">
      <table class="alert-table district-dys-table">
        <thead><tr><th>District</th><th>Rank</th><th>Janpad</th><th>Total GP</th><th>GP Progress</th><th>Dys GP</th><th>Dys %</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>
  </div>`;
}

function renderAlerts(list){
  const el=$('alerts');if(!el)return;
  const {lowByJanpad,dysByJanpad}=alertInsights(list);
  const lowRows=[];for(const g of lowByJanpad){g.items.forEach((x,i)=>lowRows.push(`<tr><td>${esc(g.janpad)}</td><td class="rank-cell">${i+1}</td><td>${esc(x.engineer)}</td><td>${esc(x.cluster||'')}</td><td>${fmt(x.ongoing)}</td><td>${fmt(x.worksMR)}</td><td><span class="mini-chip warn-chip">${coverageBadgeText(x.worksMR,x.ongoing)}</span></td></tr>`))}
  const lowHtml=lowRows.length?`<div class="alert-table-wrap"><table class="alert-table"><thead><tr><th>Janpad</th><th>Rank</th><th>Sub Engineer</th><th>Cluster(s)</th><th>Ongoing</th><th>Works with MR</th><th>MR %</th></tr></thead><tbody>${lowRows.join('')}</tbody></table></div>`:`<div class="empty-alert">Current filter में data उपलब्ध नहीं है।</div>`;
  const dysRows=[];for(const g of dysByJanpad){g.items.forEach((x,i)=>{dysRows.push(`<tr><td>${esc(g.janpad)}</td><td class="rank-cell dys-rank">${i+1}</td><td>${esc(x.engineer)}</td><td>${esc(x.cluster||'')}</td><td>${fmt(x.gps)}</td><td>${fmt(x.gpsProgress)}</td><td class="dys-count">${fmt(x.dysfunctionalGP)}</td><td class="dys-detail-cell">${dysGpDetailsHtml(x)}</td><td>${fmt(x.ongoing)}</td><td>${fmt(x.worksMR)}</td><td>${fmt(x.labour)}</td><td><span class="mini-chip warn-chip">${coverageBadgeText(x.worksMR,x.ongoing)}</span></td><td>${fmt(g.totalDys)}</td></tr>`)})}
  const dysHtml=dysRows.length?`<div class="alert-table-wrap dys-alert-wrap"><table class="alert-table dys-alert-table"><colgroup><col class="col-janpad"><col class="col-rank"><col class="col-engineer"><col class="col-cluster"><col class="col-total"><col class="col-progress"><col class="col-dys"><col class="col-detail"><col class="col-ongoing"><col class="col-worksmr"><col class="col-labour"><col class="col-mrcov"><col class="col-official"></colgroup><thead><tr><th>Janpad</th><th>Rank</th><th>Sub Engineer</th><th>Cluster(s)</th><th>Total GP</th><th>GP Progress</th><th>Dys GP</th><th>Dysfunctional GP Name / Ongoing / MR</th><th>Engineer Ongoing</th><th>Works with MR</th><th>Labour</th><th>MR %</th><th>Janpad Official Dys GP</th></tr></thead><tbody>${dysRows.join('')}</tbody></table></div>`:`<div class="empty-alert">Current filter में कोई dysfunctional GP नहीं मिला।</div>`;
    const districtDysHtml=districtHighestDysfunctionalHtml();
  el.innerHTML=`<article class="alert-card warn alert-low-card"><div class="alert-head"><span class="alert-icon">⚠</span><div><h3>Per Janpad: 03 Sub Engineer - Lowest MR Coverage</h3><p>हर Janpad के 3 सबसे कम Muster Roll coverage वाले Sub Engineer</p></div></div>${lowHtml}</article><article class="alert-card danger alert-dys-card"><div class="alert-head"><span class="alert-icon">📍</span><div><h3>Per Janpad: 03 Sub Engineer - Dysfunctional GP Alert</h3><p>Engineer-wise Dysfunctional GP + exact GP name / Ongoing / MR</p></div></div>${dysHtml}</article><article class="alert-card district-dys-card"><div class="alert-head"><span class="alert-icon">🏆</span><div><h3>District-wise Highest Dysfunctional GP</h3><p>SATNA तथा MAIHAR: Top 3 Janpad</p></div></div>${districtDysHtml}</article>`;
}
function dysfunctionalAlertTable(list){
  return dysfunctionalEngineerData(list).filter(r=>num(r.dysfunctionalGP)>0).map(r=>({janpad:r.janpad,rank:r.rank,engineer:r.engineer,cluster:r.cluster,totalGP:r.gps,gpProgress:r.gpsProgress,dysfunctionalGP:r.dysfunctionalGP,dysGpRows:r.dysGpRows,dysGpDetails:r.dysGpDetails,ongoing:r.ongoing,worksMR:r.worksMR,labour:r.labour,mrCoverage:+pct(r.worksMR,r.ongoing).toFixed(1),totalJanpadDys:r.totalJanpadDys,actualJanpadDys:r.actualJanpadDys}));
}
function renderDysfunctionalBucket(list){
  const data=dysfunctionalAlertTable(list);lastExport=data.map(({dysGpRows,...r})=>r);
  $('viewTitle').textContent='Engineer-wise Dysfunctional GP: Exact GP Names';
  $('viewMeta').textContent=`Dysfunctional GP = RepDay में GP Progress 0 • GP name + Ongoing Works + MR Issued shown • Janpad total cross-check = Official Sheet1 • ${todayDate()}`;
  $('reportTable').classList.add('dys-alert-table');
  let h=`<colgroup>
    <col class="w-janpad"><col class="w-rank"><col class="w-engineer"><col class="w-cluster">
    <col class="w-total"><col class="w-progress"><col class="w-dys"><col class="w-gpdetail">
    <col class="w-ongoing"><col class="w-worksmr"><col class="w-labour"><col class="w-mrcov"><col class="w-official">
  </colgroup><thead><tr><th>Janpad</th><th>Rank</th><th>Sub Engineer</th><th>Cluster(s)</th><th>Total GP</th><th>GP Progress</th><th>Dysfunctional GP</th><th>Dysfunctional GP Name / Work Status</th><th>Engineer Ongoing Works</th><th>Engineer Works with MR</th><th>Labour</th><th>MR Coverage</th><th>Janpad Official Dys GP</th></tr></thead><tbody>`;
  for(const r of data){h+=`<tr>${cell(r.janpad)}${cell(r.rank,true)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.totalGP,true)}${cell(r.gpProgress,true)}${cell(r.dysfunctionalGP,true)}<td class="dys-detail-cell">${dysGpDetailsHtml(r)}</td>${cell(r.ongoing,true)}${cell(r.worksMR,true)}${cell(r.labour,true)}<td>${r.mrCoverage.toFixed(1)}%</td>${cell(r.totalJanpadDys,true)}</tr>`}
  if(!data.length)h+=`<tr><td colspan="13" class="empty-table">Current filter में कोई Dysfunctional GP नहीं मिला।</td></tr>`;
  h+=`</tbody>`;$('reportTable').innerHTML=h;
}
function priorityAlertTable(list){
  const out=[];
  for(const r of list){
    const ongoing=num(r.ongoing),worksMR=num(r.worksMR),labour=num(r.labour),mrs=num(r.mrs),cover=pct(worksMR,ongoing);
    if(ongoing<=0)continue;
    let severity='',alert='';
    if(worksMR===0){severity='CRITICAL';alert='Ongoing work है लेकिन MR issued work 0';}
    else if(labour===0){severity='HIGH';alert='Ongoing work है लेकिन Labour Engagement 0';}
    else if(cover<10){severity='HIGH';alert='MR Coverage 10% से कम';}
    else if(cover<20){severity='WATCH';alert='MR Coverage 20% से कम';}
    else continue;
    out.push({severity,alert,janpad:r.janpad,engineer:r.engineer,cluster:r.cluster,panchayat:r.panchayat,ongoing,worksMR,mrCoverage:+cover.toFixed(1),labour,mrs});
  }
  const w={CRITICAL:0,HIGH:1,WATCH:2};
  return out.sort((a,b)=>w[a.severity]-w[b.severity]||a.mrCoverage-b.mrCoverage||b.ongoing-a.ongoing||clean(a.janpad).localeCompare(clean(b.janpad),'hi')||clean(a.panchayat).localeCompare(clean(b.panchayat),'hi'));
}
function renderPriorityAlerts(list){
  const data=priorityAlertTable(list);lastExport=data;
  const critical=data.filter(r=>r.severity==='CRITICAL').length,high=data.filter(r=>r.severity==='HIGH').length,watch=data.filter(r=>r.severity==='WATCH').length;
  $('viewTitle').textContent='Priority Alerts: GP Action List';
  $('viewMeta').textContent=`Critical ${fmt(critical)} • High ${fmt(high)} • Watch ${fmt(watch)} • ${todayDate()}`;
  let h=`<thead><tr><th>Priority</th><th>Alert Reason</th><th>Janpad</th><th>Sub Engineer</th><th>Cluster</th><th>Gram Panchayat</th><th>Ongoing</th><th>Works with MR</th><th>MR %</th><th>Labour</th><th>Muster Rolls</th></tr></thead><tbody>`;
  for(const r of data){h+=`<tr><td><span class="priority-chip ${r.severity.toLowerCase()}">${esc(r.severity)}</span></td><td class="alert-reason-cell">${esc(r.alert)}</td>${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.panchayat)}${cell(r.ongoing,true)}${cell(r.worksMR,true)}<td>${r.mrCoverage.toFixed(1)}%</td>${cell(r.labour,true)}${cell(r.mrs,true)}</tr>`}
  if(!data.length)h+=`<tr><td colspan="11" class="empty-table">Current filter में कोई Priority Alert नहीं मिला।</td></tr>`;
  h+='</tbody>';$('reportTable').innerHTML=h;
}
function officialFiltered(){let a=official;if($('districtFilter').value!=='ALL')a=a.filter(r=>districtOf(r.janpad)===$('districtFilter').value);if($('janpadFilter').value!=='ALL')a=a.filter(r=>r.janpad===$('janpadFilter').value);return a}

function finalWorkCategory(name,wt,fy){
 const n=clean(name),w=clean(wt),t=(n+' '+w).toLowerCase(),start=n.toLowerCase().trim();
 const has=(re)=>re.test(t), starts=(re)=>re.test(start);
 // Housing / beneficiary house stays protected.
 if(/pmay|pmay[- ]?g|pradhan\s*mantri\s*awas/i.test(w)||/pmay|pmay[- ]?g/i.test(n))return 'PMAY-G';
 // Strict Ek Bagiya rule: FY 2025-26/2026-27, actual title starts with Bagiya phrase, not school/institution context.
 const inst=/(school|prathmik|madhyamik|shala|vidyalaya|प्राथमिक|माध्यमिक|शाला|विद्यालय)/i;
 const ekStart=/^(?:ek\s+(?:ma+a?|maa|mother)?\s*ki?\s*)?(?:bagiya|bagia)|^ek\s+bagiya|^ek\s+(?:maa?|ma|mाँ|मॉ|माॅ)\s+ke\s+naam|^(?:एक\s+)?(?:माँ|मा|मॉ|माॅ)\s*(?:की|के\s+नाम)?\s*बगिया|^एक\s+बगिया/i;
 if(['2025-2026','2026-2027'].includes(clean(fy))&&ekStart.test(n)&&!inst.test(n))return 'Ek Bagiya';
 // Strong actual-work priorities: location words later in the title must not override these.
 if(has(/(?:boundary|boundry|boundri|baundri|baundry|bawandri|bawndri|baudri|baundary|baun?dr[iy]|बाउंड्री|बाउण्डी|बाउण्?डी|बाउणडी|बाउंडरी|बॉउंड्री)/i))return 'Boundary Wall';
 if(has(/(?:puliya|pulia|pulya|पुलिया|culvert|cluvert|hume\s*pipe|क्रांस|cross)/i))return 'Pulya';
 if(has(/(?:pcc|cc|cement\s*concrete|concrete|nali|नाली|drain|drainage|grey\s*water|greywater|ग्रेवाटर|cover(?:e)?d\s*nali|rural\s*connectivity)/i))return 'Cement Concrete';
 if(has(/(?:gravel|greval|grewal|graval|grable|ग्रेवल|ग्रेबल|गे्रवल|गे्वल|mitti\s*mur+am|mur+am|murram|मिट्टी\s*मुरुम|मुरुम|sudoor|sudur|सुदूर\s*सड़क|bt\s*road|बीटी\s*रोड|bitumen)/i))return 'Gravel Road';
 if(has(/(?:r\.?m\.?s\.?|आर\.?एम\.?एस|stop\s*dam|stap\s*dam|स्टाप\s*डैम|स्टापडैम|स्टाप\s*डेम|check\s*dam|चेक\s*डैम|ring\s*bund|d\s*frame|d\s*band|percolation|parkulation|पार्कुलेशन|hand\s*pump\s*recharge|handpump\s*recharge|hundpump\s*recharge)/i))return 'Water conservation & recharge';
 if(has(/(?:khet\s*talab|खेत\s*तालाब|ctr.*khet\s*talab|farm\s*pond)/i))return 'Farm Pond';
 if(has(/(?:dug\s*pond|डुग\s*पोंड|डग\s*पोंड|soak\s*pit|soakpit|shokpit|शोकपिट|gabion|rfr|nadi\s*restoration|gully\s*plug|medh\s*bandhan|loose\s*boulder|new\s*talab)/i))return 'Watershed Related Works';
 if(has(/(?:samuday(?:i|ik|ak)\s*koop|community\s*well|सामुदायिक\s*कूप|dug\s*well\s*recharge|dugwell\s*recharge)/i))return 'Dug Well Recharge';
 if(has(/(?:charagah|charagaah|chara\s*gah|chara\s*gaah|चारागाह|चारगाह|चारा\s*गाह|posh?an\s*vatika|vasudha|vashudha|bsudha|vassudha|वसुधा|vriksharopan|vraksha\s*ropan|bracharopan|braksharopan|वृक्षारोपण|व़क्षारोपण|वुक्षारोपण|faloudd?yan|faloudyan|फलोउद्यान|फलोउद्ययान|plantation|land\s*development)/i))return 'Gap Filling in Plantation';
 if(has(/(?:shanti\s*dham|santi\s*dham|santhi\s*dham|shathi\s*dham|shanti\s*daham|shantidham|shantidam|mukti\s*dham|muktidham|मुक्तिधाम|शांति\s*धाम|शांती\s*धाम|शान्ति\s*धाम|शान्तिधाम)/i))return 'Crematorium';
 if(has(/(?:panchayat\s*bhavan|panchyat\s*bhawan|panchyat\s*bhavan|naveen\s*panchayat|mangal\s*bhawan|samudai?k\s*bhawan|samudayik\s*bhavan|samudaik\s*bhavan|sabhagar\s*nirman|kaushal|कौशल|मंगल\s*भवन|पंचायत\s*भवन|सामुदायिक\s*भवन)/i))return 'Panchayat and Community Hall';
 if(has(/(?:samudai?k\s*shauchalay|samudayik\s*shauchalay|सामुदायिक\s*शौचालय|segregation|segragation|kachara|karchra|kooda|kuda|कचरा|कूड़ा|nadep)/i))return 'SBM Works';
 if(has(/(?:play\s*ground|playground|khel\s*maidan|खेल\s*मैदान|खेल\s*का\s*मैदान|खेलो\s*के\s*मैदान)/i))return 'Play Field';
 const angStart=/^(?:a+nganwadi|a+ganwadi|a+anganbadi|a+ganbadi|anganbadi|aganbadi|आंगनवाडी|आंगनवाड़ी|आंगनवाड़ी|आंगनबाडी|आंगनबाड़ी|आंगनबाड़ी|आगनबाडी|आगनबाड़ी|आगनबाड़ी|आगनवाडी|आगनवाड़ी|आगनवाड़ी|आगवाड़ी|आगवाडी|ऑगनबाडी|ऑगनबाड़ी|ऑगनबाड़ी|ऑगनवाडी|ऑगनवाड़ी|ऑगनवाड़ी|अांगनवाडी|आंंगनवाडी)/i;
 if(starts(angStart)&&has(/(?:bhavan|bhawan|nirman|kendra|sewa\s*kendra|शेष\s*कार्य|कार्य|भवन|निर्माण|केंद्र)/i))return 'Anganwadi';
 if(has(/(?:kapil\s*dhara|kapildhara|कपिलधारा|open\s*dug\s*well|open\s*dugwell)/i))return 'Kapildhara';
 if(has(/(?:cattle\s*shed|goat\s*shelter|poultry|pasu\s*shed|pashu\s*shed|पशु\s*शेड)/i))return 'Poultry Cattle and Goat Shelter';
 if(has(/(?:micro\s*irrigation|सूक्ष्म\s*सिंचाई)/i))return 'Irrigation infrastructure';
 // Protected / residual Other Works examples from the established rules.
 if(has(/(?:uchit\s*mul|उचित\s*मूल|pds|food\s*grain|foodgrain|khad[hy]*yan|खाद्यान|खय्दायन|godam|gaushala|gau\s*shala|chabut|चबुत|paver|pever|pewar|retaining\s*wall|retarning\s*wall|ghat\s*nirman|bus\s*stop|pani\s*tanki|water\s*tank|kitchen\s*shed|laboratory|प्रयोगशाला|sub\s*health|उप\s*स्वास्थ्य|rangmanch|park|paper)/i))return 'Other Works';
 // Normalize common raw work types when the name itself is sparse.
 const rw=w.toLowerCase();
 if(/crematorium/.test(rw))return 'Crematorium';
 if(/plantation|chara\s*gaah/.test(rw))return 'Gap Filling in Plantation';
 if(/check\s*dam|percolation/.test(rw))return 'Water conservation & recharge';
 if(/khet\s*talab|farm\s*pond/.test(rw))return 'Farm Pond';
 if(/dug\s*pond|soak\s*pit|gully\s*plug/.test(rw))return 'Watershed Related Works';
 if(/play\s*ground/.test(rw))return 'Play Field';
 if(/pcc|coverd\s*nali/.test(rw))return 'Cement Concrete';
 if(/puliya|pulya/.test(rw))return 'Pulya';
 if(/boundary/.test(rw))return 'Boundary Wall';
 if(/cattle\s*shed/.test(rw))return 'Poultry Cattle and Goat Shelter';
 if(/nadep|segregation|\bcsc\b/.test(rw))return 'SBM Works';
 if(/old\s*water|amrit\s*sarovar|roof\s*top/.test(rw))return 'Water conservation & recharge';
 if(/contour\s*trench|loose\s*bolder|loose\s*boulder|nala\s*trench/.test(rw))return 'Watershed Related Works';
 if(/panchayat.*community.*bhawan|community.*bhawan/.test(rw))return 'Panchayat and Community Hall';
 if(/other/.test(rw))return 'Other Works';
 return w||'Other Works';
}
function categoryFiltered(){const d=$('districtFilter').value,j=$('janpadFilter').value,e=$('engineerFilter').value,c=$('clusterFilter').value,k=$('categoryFilter')?.value||'ALL';return categorymix.filter(r=>(d==='ALL'||districtOf(r.janpad)===d)&&(j==='ALL'||r.janpad===j)&&(e==='ALL'||r.engineer===e)&&(c==='ALL'||r.cluster===c)&&(k==='ALL'||r.category===k))}
function correctedWorkFiltered(){const d=$('districtFilter').value,j=$('janpadFilter').value,e=$('engineerFilter').value,c=$('clusterFilter').value,k=$('categoryFilter')?.value||'ALL';return ongoingDetails.filter(r=>{const cat=clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy);return (d==='ALL'||districtOf(r.janpad)===d)&&(j==='ALL'||r.janpad===j)&&(e==='ALL'||r.engineer===e)&&(c==='ALL'||r.cluster===c)&&(k==='ALL'||cat===k)})}
function rebuildCorrectedWorkData(){
 const wm=new Map(),cm=new Map(),bucket=p=>p<=0?'b0':p<=25?'b25':p<=60?'b60':p<=75?'b75':p<=90?'b90':'b90p';
 for(const r of ongoingDetails){
  const jan=clean(r.janpad),eng=clean(r.engineer)||'Unmapped',cl=clean(r.cluster)||'Unmapped',gp=clean(r.panchayat),cat=clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy),san=num(r.sanction),book=num(r.booked),ep=san?book*100/san:0;
  const wk=[jan,eng,cl,gp].join('¦');if(!wm.has(wk))wm.set(wk,{janpad:jan,engineer:eng,cluster:cl,panchayat:gp,workTotal:0,pmayOngoing:0,ekOngoing:0,currentFYActive:0});const z=wm.get(wk);z.workTotal++;if(/PMAY/i.test(cat))z.pmayOngoing++;if(cat==='Ek Bagiya Maa Ke Naam'||cat==='Ek Bagiya')z.ekOngoing++;if(num(r.julyMandays)>0||num(r.currentFYMandays)>0)z.currentFYActive++;
  const ck=[jan,eng,cl,gp,cat].join('¦');if(!cm.has(ck))cm.set(ck,{janpad:jan,engineer:eng,cluster:cl,panchayat:gp,category:cat,workCount:0,totalSanction:0,totalBooked:0,nregaAprJunMandays:0,julyMandays:0,b0:0,b25:0,b60:0,b75:0,b90:0,b90p:0});const q=cm.get(ck);q.workCount++;q.totalSanction+=san;q.totalBooked+=book;q.nregaAprJunMandays+=num(r.nregaAprJunMandays);q.julyMandays+=num(r.julyMandays);q[bucket(ep)]++;
 }
 workmix=[...wm.values()];categorymix=[...cm.values()];
}
rebuildCorrectedWorkData();
function moneyLakh(v){return (num(v)/100000).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function renderOngoingAllSummary(){
  const src=categoryFiltered();
  const data=aggregate(src,['janpad','engineer','cluster'],['workCount','totalSanction','totalBooked','b0','b25','b60','b75','b90','b90p'])
    .sort((a,b)=>clean(a.janpad).localeCompare(clean(b.janpad),'hi')||clean(a.engineer).localeCompare(clean(b.engineer),'hi')||clean(a.cluster).localeCompare(clean(b.cluster),'hi'));
  const mm=aggregate(workmix,['janpad','engineer','cluster'],['workTotal','pmayOngoing','ekOngoing','currentFYActive']);
  const mmap=new Map(mm.map(r=>[[clean(r.janpad),clean(r.engineer),clean(r.cluster)].join('¦'),r]));
  for(const r of data){const x=mmap.get([clean(r.janpad),clean(r.engineer),clean(r.cluster)].join('¦'))||{};r.pmayOngoing=num(x.pmayOngoing);r.ekOngoing=num(x.ekOngoing);r.currentFYActive=num(x.currentFYActive);r.remaining=Math.max(0,num(r.totalSanction)-num(r.totalBooked));r.expPct=r.totalSanction?num(r.totalBooked)*100/num(r.totalSanction):0;}
  lastExport=data;$('viewTitle').textContent='Ongoing Work All: Summary Report';$('viewMeta').textContent=`Official VB-G RAM G Ongoing Work source + current VBG work-level data • ${todayDate()}`;
  let h=`<thead><tr><th>Janpad</th><th>Engineer / Upyantri</th><th>Cluster</th><th>Ongoing Works</th><th>PMAY-G</th><th>Ek Bagiya</th><th>Current FY Active</th><th>0%</th><th>1–25%</th><th>26–60%</th><th>61–75%</th><th>76–90%</th><th>&gt;90%</th><th>Sanction ₹ Lakh</th><th>Booked ₹ Lakh</th><th>Remaining ₹ Lakh</th><th>Exp %</th></tr></thead><tbody>`;
  for(const r of data){h+=`<tr>${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.workCount,true)}${cell(r.pmayOngoing,true)}${cell(r.ekOngoing,true)}${cell(r.currentFYActive,true)}${cell(r.b0,true)}${cell(r.b25,true)}${cell(r.b60,true)}${cell(r.b75,true)}${cell(r.b90,true)}${cell(r.b90p,true)}<td>${moneyLakh(r.totalSanction)}</td><td>${moneyLakh(r.totalBooked)}</td><td>${moneyLakh(r.remaining)}</td><td>${r.expPct.toFixed(1)}%</td></tr>`}
  const ks=['workCount','pmayOngoing','ekOngoing','currentFYActive','b0','b25','b60','b75','b90','b90p','totalSanction','totalBooked','remaining'],t={};ks.forEach(k=>t[k]=sum(data,k));const ep=t.totalSanction?t.totalBooked*100/t.totalSanction:0;
  h+=`<tr class="total-row"><td>TOTAL</td><td></td><td></td>${cell(t.workCount,true)}${cell(t.pmayOngoing,true)}${cell(t.ekOngoing,true)}${cell(t.currentFYActive,true)}${cell(t.b0,true)}${cell(t.b25,true)}${cell(t.b60,true)}${cell(t.b75,true)}${cell(t.b90,true)}${cell(t.b90p,true)}<td>${moneyLakh(t.totalSanction)}</td><td>${moneyLakh(t.totalBooked)}</td><td>${moneyLakh(t.remaining)}</td><td>${ep.toFixed(1)}%</td></tr>`;
  if(!data.length)h+=`<tr><td colspan="17" class="empty-table">Current filter में Ongoing Work data नहीं मिला।</td></tr>`;h+='</tbody>';$('reportTable').innerHTML=h;
}
function ekBagiyaFiltered(){
  const d=$('districtFilter').value,j=$('janpadFilter').value,e=$('engineerFilter').value,c=$('clusterFilter').value;
  const seen=new Set();
  return ongoingDetails.filter(r=>{
    if(d!=='ALL'&&districtOf(r.janpad)!==d)return false;
    if(j!=='ALL'&&r.janpad!==j)return false;
    if(e!=='ALL'&&r.engineer!==e)return false;
    if(c!=='ALL'&&r.cluster!==c)return false;
    if((clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy))!=='Ek Bagiya Maa Ke Naam' && (clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy))!=='Ek Bagiya')return false;
    const code=clean(r.code); if(code&&seen.has(code))return false; if(code)seen.add(code);
    return true;
  });
}
function renderEkBagiyaDashboard(){
  const src=ekBagiyaFiltered().filter(r=>['2025-2026','2026-2027'].includes(clean(r.fy)));
  const m=new Map();
  const bucket=p=>p<=0?'b0':p<=25?'b25':p<=60?'b60':p<=75?'b75':p<=90?'b90':'b90p';
  for(const r of src){
    const key=[r.janpad,r.engineer,r.cluster].map(clean).join('¦');
    if(!m.has(key))m.set(key,{district:districtOf(r.janpad),janpad:r.janpad,engineer:r.engineer,cluster:r.cluster,workCount:0,activeWorks:0,nilMandays:0,nregaAprJunMandays:0,julyMandays:0,totalSanction:0,totalBooked:0,b0:0,b25:0,b60:0,b75:0,b90:0,b90p:0});
    const x=m.get(key),ep=num(r.expPct);x.workCount++;x.nregaAprJunMandays+=num(r.nregaAprJunMandays);x.julyMandays+=num(r.julyMandays);if(num(r.julyMandays)>0)x.activeWorks++;else x.nilMandays++;x.totalSanction+=num(r.sanction);x.totalBooked+=num(r.booked);x[bucket(ep)]++;
  }
  let data=[...m.values()].map(r=>({...r,remaining:Math.max(0,r.totalSanction-r.totalBooked),expPct:r.totalSanction?r.totalBooked*100/r.totalSanction:0,ongoing:num(r.workCount),ekOngoing:num(r.workCount),labour:num(r.julyMandays)}));
  data=sortRows(data,'ekOngoing',['engineer','janpad','cluster']);
  lastExport=data;$('viewTitle').textContent='एक बगिया माँ के नाम — Ongoing Works Dashboard';
  const totalWorks=src.length,q1=sum(src,'nregaAprJunMandays'),july=sum(src,'julyMandays'),active=src.filter(r=>num(r.julyMandays)>0).length,nil=totalWorks-active,sanc=sum(src,'sanction'),book=sum(src,'booked'),rem=Math.max(0,sanc-book),ep=sanc?book*100/sanc:0;
  $('viewMeta').textContent=`Corrected Final Work Category • FY 2025-26 & 2026-27 • ${fmt(totalWorks)} ongoing works • NREGA Apr–Jun mandays ${fmt(q1)} • 1 Jul–Today Ek Bagiya mandays ${fmt(july)} • Active ${fmt(active)} • NIL ${fmt(nil)} • ${todayDate()}`;
  let h=`<thead><tr><th>District</th><th>Janpad</th><th>Sub Engineer / Upyantri</th><th>Cluster</th><th>Ek Bagiya Ongoing</th><th>Current FY Active</th><th>NIL 1 Jul–Today Mandays</th><th>NREGA Mandays<br>01 Apr–30 Jun</th><th>Ek Bagiya Mandays<br>01 Jul–Today</th><th>0%</th><th>1–25%</th><th>26–60%</th><th>61–75%</th><th>76–90%</th><th>&gt;90%</th><th>Sanction ₹ Lakh</th><th>Booked ₹ Lakh</th><th>Remaining ₹ Lakh</th><th>Exp %</th></tr></thead><tbody>`;
  for(const r of data){h+=`<tr>${cell(r.district)}${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.workCount,true)}${cell(r.activeWorks,true)}${cell(r.nilMandays,true)}${cell(r.nregaAprJunMandays,true)}${cell(r.julyMandays,true)}${cell(r.b0,true)}${cell(r.b25,true)}${cell(r.b60,true)}${cell(r.b75,true)}${cell(r.b90,true)}${cell(r.b90p,true)}<td>${moneyLakh(r.totalSanction)}</td><td>${moneyLakh(r.totalBooked)}</td><td>${moneyLakh(r.remaining)}</td><td>${r.expPct.toFixed(1)}%</td></tr>`}
  const ks=['workCount','activeWorks','nilMandays','nregaAprJunMandays','julyMandays','b0','b25','b60','b75','b90','b90p','totalSanction','totalBooked','remaining'],t={};ks.forEach(k=>t[k]=sum(data,k));
  h+=`<tr class="total-row"><td>TOTAL</td><td></td><td></td><td></td>${cell(t.workCount,true)}${cell(t.activeWorks,true)}${cell(t.nilMandays,true)}${cell(t.nregaAprJunMandays,true)}${cell(t.julyMandays,true)}${cell(t.b0,true)}${cell(t.b25,true)}${cell(t.b60,true)}${cell(t.b75,true)}${cell(t.b90,true)}${cell(t.b90p,true)}<td>${moneyLakh(t.totalSanction)}</td><td>${moneyLakh(t.totalBooked)}</td><td>${moneyLakh(t.remaining)}</td><td>${ep.toFixed(1)}%</td></tr>`;
  if(!data.length)h+=`<tr><td colspan="19" class="empty-table">Current filter में Ek Bagiya ongoing work नहीं मिला।</td></tr>`;
  h+='</tbody>';$('reportTable').innerHTML=h;
}
function renderCategoryBuckets(){const src=categoryFiltered();const data=aggregate(src,['category'],['workCount','totalSanction','totalBooked','b0','b25','b60','b75','b90','b90p']).sort((a,b)=>num(b.workCount)-num(a.workCount)||clean(a.category).localeCompare(clean(b.category),'hi'));data.forEach(r=>r.expPct=r.totalSanction?num(r.totalBooked)*100/num(r.totalSanction):0);lastExport=data;$('viewTitle').textContent='Final Category-wise Ongoing Work Buckets';$('viewMeta').textContent=`${fmt(data.length)} Final Categories • Established Final Work Category Rules • Expenditure = Booked Since Inception ÷ Total Sanction • ${todayDate()}`;let h=`<thead><tr><th>Work Category</th><th>Total Works</th><th>0%</th><th>1%–25%</th><th>26%–60%</th><th>61%–75%</th><th>76%–90%</th><th>&gt;90%</th><th>Sanction ₹ Lakh</th><th>Booked ₹ Lakh</th><th>Exp %</th></tr></thead><tbody>`;for(const r of data){h+=`<tr>${cell(r.category)}${cell(r.workCount,true)}<td class="bucket-zero">${fmt(r.b0)}</td>${cell(r.b25,true)}${cell(r.b60,true)}${cell(r.b75,true)}${cell(r.b90,true)}<td class="bucket-good">${fmt(r.b90p)}</td><td>${moneyLakh(r.totalSanction)}</td><td>${moneyLakh(r.totalBooked)}</td><td><span class="exp-pct-chip ${r.expPct===0?'critical':r.expPct<=25?'low':r.expPct>90?'good':''}">${r.expPct.toFixed(1)}%</span></td></tr>`}const t={};['workCount','totalSanction','totalBooked','b0','b25','b60','b75','b90','b90p'].forEach(k=>t[k]=sum(data,k));const ep=t.totalSanction?t.totalBooked*100/t.totalSanction:0;h+=`<tr class="total-row"><td>TOTAL</td>${cell(t.workCount,true)}${cell(t.b0,true)}${cell(t.b25,true)}${cell(t.b60,true)}${cell(t.b75,true)}${cell(t.b90,true)}${cell(t.b90p,true)}<td>${moneyLakh(t.totalSanction)}</td><td>${moneyLakh(t.totalBooked)}</td><td>${ep.toFixed(1)}%</td></tr>`;if(!data.length)h+=`<tr><td colspan="11" class="empty-table">Current filter में Category data नहीं मिला।</td></tr>`;h+='</tbody>';$('reportTable').innerHTML=h}
function renderExpBuckets(){const src=categoryFiltered();const data=aggregate(src,['janpad','engineer','cluster'],['workCount','b0','b25','b60','b75','b90','b90p','totalSanction','totalBooked']).sort((a,b)=>num(b.b0)-num(a.b0)||num(b.workCount)-num(a.workCount)||clean(a.janpad).localeCompare(clean(b.janpad),'hi')||clean(a.engineer).localeCompare(clean(b.engineer),'hi'));data.forEach(r=>r.expPct=r.totalSanction?num(r.totalBooked)*100/num(r.totalSanction):0);lastExport=data;$('viewTitle').textContent='Expenditure %: Ongoing Work Buckets';$('viewMeta').textContent=`0% को Critical priority • 1–25% Low expenditure • ${todayDate()}`;let h=`<thead><tr><th>Janpad</th><th>Sub Engineer</th><th>Cluster</th><th>Total Works</th><th>0%</th><th>1%–25%</th><th>26%–60%</th><th>61%–75%</th><th>76%–90%</th><th>&gt;90%</th><th>Overall Exp %</th></tr></thead><tbody>`;for(const r of data){h+=`<tr>${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.workCount,true)}<td class="bucket-zero">${fmt(r.b0)}</td>${cell(r.b25,true)}${cell(r.b60,true)}${cell(r.b75,true)}${cell(r.b90,true)}<td class="bucket-good">${fmt(r.b90p)}</td><td><span class="exp-pct-chip ${r.expPct===0?'critical':r.expPct<=25?'low':r.expPct>90?'good':''}">${r.expPct.toFixed(1)}%</span></td></tr>`}const t={};['workCount','b0','b25','b60','b75','b90','b90p','totalSanction','totalBooked'].forEach(k=>t[k]=sum(data,k));const ep=t.totalSanction?t.totalBooked*100/t.totalSanction:0;h+=`<tr class="total-row"><td>TOTAL</td><td></td><td></td>${cell(t.workCount,true)}${cell(t.b0,true)}${cell(t.b25,true)}${cell(t.b60,true)}${cell(t.b75,true)}${cell(t.b90,true)}${cell(t.b90p,true)}<td>${ep.toFixed(1)}%</td></tr>`;if(!data.length)h+=`<tr><td colspan="11" class="empty-table">Current filter में expenditure bucket data नहीं मिला।</td></tr>`;h+='</tbody>';$('reportTable').innerHTML=h}
function cell(v,isnum=false){return `<td>${isnum?fmt(v):esc(v)}</td>`}function badge(a,b){const p=pct(a,b);return `<span class="badge ${p>=10?'good':'warn'}">${p.toFixed(1)}%</span>`}
function renderOngoingDetails(){
 const data=filterRows(ongoingDetails).slice().sort((a,b)=>clean(a.janpad).localeCompare(clean(b.janpad),'hi')||clean(a.engineer).localeCompare(clean(b.engineer),'hi')||clean(a.panchayat).localeCompare(clean(b.panchayat),'hi')||clean(a.code).localeCompare(clean(b.code)));
 lastExport=data;$('viewTitle').textContent='Ongoing Works: Janpad-wise Work Sheet';$('viewMeta').innerHTML=`${fmt(data.length)} ongoing works • dynamic_work_details work-level data • <a href="data/Ongoing_Works_dynamic_work_details_latest.csv" download>Download Full CSV</a> • ${todayDate()}`;
 let h=`<thead><tr><th>S.No.</th><th>Janpad</th><th>Engineer / Upyantri</th><th>Cluster</th><th>GP</th><th>FY</th><th>Work Code</th><th>Work Name</th><th>Work Type</th><th>Sanction ₹</th><th>Booked ₹</th><th>Exp %</th><th>Total Mandays</th><th>NREGA 01 Apr–30 Jun Mandays</th><th>VBGRAMG 01 Jul–Today Mandays</th></tr></thead><tbody>`;
 for(let i=0;i<data.length;i++){const r=data[i];h+=`<tr>${cell(i+1,true)}${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.panchayat)}${cell(r.fy)}${cell(r.code)}${cell(r.name)}${cell(r.type)}<td>${num(r.sanction).toLocaleString('en-IN',{maximumFractionDigits:2})}</td><td>${num(r.booked).toLocaleString('en-IN',{maximumFractionDigits:2})}</td><td>${num(r.expPct).toFixed(1)}%</td>${cell(r.mandays,true)}${cell(r.nregaAprJunMandays,true)}${cell(r.julyMandays,true)}</tr>`}
 if(!data.length)h+=`<tr><td colspan="17" class="empty-table">Current filter में Ongoing Work नहीं मिला।</td></tr>`;h+='</tbody>';$('reportTable').innerHTML=h;
}
function emusterReportDate(){
  const d=extractDate(reportTitle||'');
  if(d){const p=d.split('-');return `${p[0]}/${p[1]}/${p[2]}`;}
  const sd=autoMeta?.sourceDates||{};
  const x=sd.Sheet1||sd.RepDay||'';
  if(x){const p=String(x).split('-');return p.length===3?`${p[0]}/${p[1]}/${p[2]}`:x;}
  return todayDate().replaceAll('-','/');
}
function renderStateDistrict(){
  const dd=dailyFiltered().map(r=>({...r,district:districtOf(r.janpad)}));
  const d=aggregate(dd,['district'],['totalGP','gpsProgress','labour','worksMR','mrs']);
  const om=aggregate(officialFiltered().map(r=>({...r,district:districtOf(r.janpad)})),['district'],['ongoingAll','ekOngoing']);
  const ox=new Map(om.map(r=>[r.district,r]));
  d.forEach(r=>{const o=ox.get(r.district)||{};r.ongoing=num(o.ongoingAll);r.ekOngoing=num(o.ekOngoing);r.state='MADHYA PRADESH';});
  const data=sortRows(d,'ongoing',['district']);
  lastExport=data;$('viewTitle').textContent='State → District Daily Status (Satna + Maihar)';
  $('viewMeta').textContent=`MADHYA PRADESH • ${data.length} District in this portal • Highest/Lowest filter enabled • ${emusterReportDate()}`;
  let h=`<thead><tr class="emuster-title-row"><th colspan="10">State : MADHYA PRADESH — District Daily Status as on ${esc(emusterReportDate())}</th></tr><tr><th>Rank</th><th>State</th><th>District</th><th>Total GP</th><th>GPs with Works in Progress</th><th>Labour Engagement</th><th>Works with MR Issued</th><th>Total Ongoing Work</th><th>Muster Rolls</th><th>Ek Bagiya Ongoing</th></tr></thead><tbody>`;
  data.forEach((r,i)=>{h+=`<tr><td>${i+1}</td>${cell(r.state)}${cell(r.district)}${cell(r.totalGP,true)}${cell(r.gpsProgress,true)}${cell(r.labour,true)}${cell(r.worksMR,true)}${cell(r.ongoing,true)}${cell(r.mrs,true)}${cell(r.ekOngoing,true)}</tr>`});
  const t={};['totalGP','gpsProgress','labour','worksMR','ongoing','mrs','ekOngoing'].forEach(k=>t[k]=sum(d,k));
  h+=`<tr class="total-row"><td></td><td>MADHYA PRADESH</td><td>PORTAL TOTAL</td>${cell(t.totalGP,true)}${cell(t.gpsProgress,true)}${cell(t.labour,true)}${cell(t.worksMR,true)}${cell(t.ongoing,true)}${cell(t.mrs,true)}${cell(t.ekOngoing,true)}</tr></tbody>`;
  $('reportTable').innerHTML=h;
}

function renderEmuster(){
  const order=['AMARPATAN','MAIHAR','MAJHGAWAN','NAGOD','RAMNAGAR','RAMPUR BAGHELAN','SATNA','UNCHAHARA'];
  const dmap=new Map(dailyFiltered().map(r=>[normJanpad(r.janpad),r]));
  const omap=new Map(officialFiltered().map(r=>[normJanpad(r.janpad),r]));
  let data=order.map(j=>dmap.get(j)).filter(Boolean).map((r,i)=>({
    sno:i+1,janpad:normJanpad(r.janpad),totalGP:num(r.totalGP),gpsProgress:num(r.gpsProgress),gpProgress:num(r.gpsProgress),
    labour:num(r.labour),worksMR:num(r.worksMR),ongoing:num(omap.get(normJanpad(r.janpad))?.ongoingAll),mrs:num(r.mrs)
  }));
  data=sortRows(data,'ongoing',['janpad']).map((r,i)=>({...r,sno:i+1}));
  lastExport=data;
  $('viewTitle').textContent='R6.9 Daily Status of VB-G RAM G Based on e-Muster Issuance';
  $('viewMeta').textContent=`Official Screen-2 • SATNA + MAIHAR 8 Janpad • as on ${emusterReportDate()}`;
  const cols=8;
  let h=`<thead><tr class="emuster-title-row"><th colspan="${cols}">R6.9 Daily Status of VB-G RAM G Based on e-Muster Issuance as on ${esc(emusterReportDate())}</th></tr>
  <tr class="emuster-note-row"><th colspan="${cols}"><i>Official R6.9 Screen-2 format</i></th></tr>
  <tr class="emuster-group-row"><th>SNo.</th><th>Blocks</th><th>Total No. of Gram Panchayats (GPs)</th><th>No. of Gram Panchayats (GPs) with Works in Progress</th><th>Maximum Expected Unskilled Labour Engagement as per e-Muster Roll*</th><th>No. of Ongoing Works for which Muster Rolls (MRs) have been Issued</th><th>Total Ongoing Work</th><th>No. of Muster Rolls (MRs)</th></tr></thead><tbody>`;
  const t={totalGP:sum(data,'totalGP'),gpProgress:sum(data,'gpProgress'),labour:sum(data,'labour'),worksMR:sum(data,'worksMR'),ongoing:sum(data,'ongoing'),mrs:sum(data,'mrs')};
  h+=`<tr class="total-row"><td></td><td>Total</td>${cell(t.totalGP,true)}${cell(t.gpProgress,true)}${cell(t.labour,true)}${cell(t.worksMR,true)}${cell(t.ongoing,true)}${cell(t.mrs,true)}</tr>`;
  for(const r of data){h+=`<tr>${cell(r.sno,true)}${cell(r.janpad)}${cell(r.totalGP,true)}${cell(r.gpProgress,true)}${cell(r.labour,true)}${cell(r.worksMR,true)}${cell(r.ongoing,true)}${cell(r.mrs,true)}</tr>`;}
  h+=`<tr class="total-row"><td></td><td>Total</td>${cell(t.totalGP,true)}${cell(t.gpProgress,true)}${cell(t.labour,true)}${cell(t.worksMR,true)}${cell(t.ongoing,true)}${cell(t.mrs,true)}</tr>`;
  if(!data.length)h+=`<tr><td colspan="${cols}" class="empty-table">Current filter में R6.9 data नहीं मिला।</td></tr>`;
  h+='</tbody>';$('reportTable').innerHTML=h;
}

function renderJanpadDysfunctional(){
  const data=sortRows(officialFiltered().map(r=>({
    district:districtOf(r.janpad), janpad:r.janpad, totalGP:num(r.totalGP), gpProgress:num(r.musterGP),
    dysfunctionalGP:num(r.dysfunctionalGP), dysfunctionalPct:+pct(num(r.dysfunctionalGP),num(r.totalGP)).toFixed(1),
    ongoing:num(r.ongoingAll), worksMR:num(r.mrAll), labour:num(r.labourAll), mrs:num(r.mrs||0)
  })),'dysfunctionalGP',['janpad']);
  lastExport=data;
  $('viewTitle').textContent='Janpad-wise Dysfunctional GP Report';
  $('viewMeta').textContent=`SATNA + MAIHAR 8 Janpad • Highest Dysfunctional GP first • ${todayDate()}`;
  let h=`<thead><tr><th>Rank</th><th>District</th><th>Janpad</th><th>Total GP</th><th>GP Progress</th><th>Dysfunctional GP</th><th>Dysfunctional %</th><th>Total Ongoing Work</th><th>Works with MR</th><th>MR %</th><th>Labour</th><th>Muster Rolls</th></tr></thead><tbody>`;
  data.forEach((r,i)=>{h+=`<tr><td>${i+1}</td>${cell(r.district)}${cell(r.janpad)}${cell(r.totalGP,true)}${cell(r.gpProgress,true)}${cell(r.dysfunctionalGP,true)}<td>${r.dysfunctionalPct.toFixed(1)}%</td>${cell(r.ongoing,true)}${cell(r.worksMR,true)}<td>${pct(r.worksMR,r.ongoing).toFixed(1)}%</td>${cell(r.labour,true)}${cell(r.mrs,true)}</tr>`});
  const t={};['totalGP','gpProgress','dysfunctionalGP','ongoing','worksMR','labour','mrs'].forEach(k=>t[k]=sum(data,k));
  h+=`<tr class="total-row"><td></td><td>TOTAL</td><td></td>${cell(t.totalGP,true)}${cell(t.gpProgress,true)}${cell(t.dysfunctionalGP,true)}<td>${pct(t.dysfunctionalGP,t.totalGP).toFixed(1)}%</td>${cell(t.ongoing,true)}${cell(t.worksMR,true)}<td>${pct(t.worksMR,t.ongoing).toFixed(1)}%</td>${cell(t.labour,true)}${cell(t.mrs,true)}</tr></tbody>`;
  $('reportTable').innerHTML=h;
}

function renderOfficial(){const data=sortRows(officialFiltered().map(r=>({...r,ongoing:num(r.ongoingAll),worksMR:num(r.mrAll),labour:num(r.labourAll),gpsProgress:num(r.musterGP)})),'ongoing',['janpad']);lastExport=data;$('viewTitle').textContent='Official Janpad Daily Report';$('viewMeta').textContent=`${data.length} Janpad • ${todayDate()}`;let h=`<thead><tr><th rowspan="2">District</th><th rowspan="2">Janpad</th><th colspan="3">Gram Panchayat</th><th colspan="5">All Types of Works / Screen-2</th><th colspan="2">Individual Land (Cat-IV)</th><th colspan="3">Community Works</th><th colspan="3">PMAY-G</th><th colspan="4">Ek Bagiya</th></tr><tr><th>Total GP</th><th>GP Progress</th><th>Dysfunctional</th><th>Labour</th><th>Works with MR</th><th>Total Ongoing Work</th><th>Muster Rolls</th><th>MR %</th><th>Labour</th><th>Works MR</th><th>Labour</th><th>Works MR</th><th>Share %</th><th>Ongoing</th><th>MR Issued</th><th>MR %</th><th>Labour</th><th>Ongoing</th><th>MR Issued</th><th>MR %</th></tr></thead><tbody>`;for(const r of data){h+=`<tr>${cell(districtOf(r.janpad))}${cell(r.janpad)}${cell(r.totalGP,true)}${cell(r.musterGP,true)}${cell(r.dysfunctionalGP,true)}${cell(r.labourAll,true)}${cell(r.mrAll,true)}${cell(r.ongoingAll,true)}${cell(r.mrs||0,true)}<td>${badge(r.mrAll,r.ongoingAll)}</td>${cell(r.labourIndividual,true)}${cell(r.mrIndividual,true)}${cell(r.labourCommunity,true)}${cell(r.mrCommunity,true)}<td>${badge(r.mrCommunity,r.mrAll)}</td>${cell(r.pmayOngoing,true)}${cell(r.pmayMR,true)}<td>${badge(r.pmayMR,r.pmayOngoing)}</td>${cell(r.ekLabour,true)}${cell(r.ekOngoing,true)}${cell(r.ekMR,true)}<td>${badge(r.ekMR,r.ekOngoing)}</td></tr>`}const keys=['totalGP','musterGP','dysfunctionalGP','labourAll','mrAll','mrs','ongoingAll','labourIndividual','mrIndividual','labourCommunity','mrCommunity','pmayOngoing','pmayMR','ekLabour','ekOngoing','ekMR'],t={};keys.forEach(k=>t[k]=sum(data,k));h+=`<tr class="total-row"><td>TOTAL</td><td></td>${cell(t.totalGP,true)}${cell(t.musterGP,true)}${cell(t.dysfunctionalGP,true)}${cell(t.labourAll,true)}${cell(t.mrAll,true)}${cell(t.ongoingAll,true)}${cell(t.mrs,true)}<td>${pct(t.mrAll,t.ongoingAll).toFixed(1)}%</td>${cell(t.labourIndividual,true)}${cell(t.mrIndividual,true)}${cell(t.labourCommunity,true)}${cell(t.mrCommunity,true)}<td>${pct(t.mrCommunity,t.mrAll).toFixed(1)}%</td>${cell(t.pmayOngoing,true)}${cell(t.pmayMR,true)}<td>${pct(t.pmayMR,t.pmayOngoing).toFixed(1)}%</td>${cell(t.ekLabour,true)}${cell(t.ekOngoing,true)}${cell(t.ekMR,true)}<td>${pct(t.ekMR,t.ekOngoing).toFixed(1)}%</td></tr></tbody>`;$('reportTable').innerHTML=h}
function renderEngineerOfficial(){const data=sortRows(engineerOfficialData(filteredRows()).map(r=>({...r,ongoing:num(r.ongoingAll),worksMR:num(r.mrAll),labour:num(r.labourAll),gpsProgress:num(r.musterGP),ekOngoing:num(r.ekOngoing)})),'ongoing',['engineer','janpad']);lastExport=data;$('viewTitle').textContent='Sub Engineer Daily Report — Janpad Report Same Format';$('viewMeta').textContent=`${data.length} Sub Engineer rows • Official Janpad totals reconciled • ${todayDate()}`;let h=`<thead><tr><th rowspan="2">District</th><th rowspan="2">Janpad</th><th rowspan="2">Sub Engineer</th><th rowspan="2">Cluster(s)</th><th colspan="3">Gram Panchayat</th><th colspan="5">All Types of Works / Screen-2</th><th colspan="2">Individual Land (Cat-IV)</th><th colspan="3">Community Works</th><th colspan="3">PMAY-G</th><th colspan="4">Ek Bagiya</th></tr><tr><th>Total GP</th><th>GP Progress</th><th>Dysfunctional</th><th>Labour</th><th>Works with MR</th><th>Total Ongoing Work</th><th>Muster Rolls</th><th>MR %</th><th>Labour</th><th>Works MR</th><th>Labour</th><th>Works MR</th><th>Share %</th><th>Ongoing</th><th>MR Issued</th><th>MR %</th><th>Labour</th><th>Ongoing</th><th>MR Issued</th><th>MR %</th></tr></thead><tbody>`;for(const r of data){h+=`<tr>${cell(r.district)}${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.totalGP,true)}${cell(r.musterGP,true)}${cell(r.dysfunctionalGP,true)}${cell(r.labourAll,true)}${cell(r.mrAll,true)}${cell(r.ongoingAll,true)}${cell(r.mrs||0,true)}<td>${badge(r.mrAll,r.ongoingAll)}</td>${cell(r.labourIndividual,true)}${cell(r.mrIndividual,true)}${cell(r.labourCommunity,true)}${cell(r.mrCommunity,true)}<td>${badge(r.mrCommunity,r.mrAll)}</td>${cell(r.pmayOngoing,true)}${cell(r.pmayMR,true)}<td>${badge(r.pmayMR,r.pmayOngoing)}</td>${cell(r.ekLabour,true)}${cell(r.ekOngoing,true)}${cell(r.ekMR,true)}<td>${badge(r.ekMR,r.ekOngoing)}</td></tr>`}const keys=['totalGP','musterGP','dysfunctionalGP','labourAll','mrAll','mrs','ongoingAll','labourIndividual','mrIndividual','labourCommunity','mrCommunity','pmayOngoing','pmayMR','ekLabour','ekOngoing','ekMR'],t={};keys.forEach(k=>t[k]=sum(data,k));h+=`<tr class="total-row"><td>TOTAL</td><td></td><td></td><td></td>${cell(t.totalGP,true)}${cell(t.musterGP,true)}${cell(t.dysfunctionalGP,true)}${cell(t.labourAll,true)}${cell(t.mrAll,true)}${cell(t.ongoingAll,true)}${cell(t.mrs,true)}<td>${pct(t.mrAll,t.ongoingAll).toFixed(1)}%</td>${cell(t.labourIndividual,true)}${cell(t.mrIndividual,true)}${cell(t.labourCommunity,true)}${cell(t.mrCommunity,true)}<td>${pct(t.mrCommunity,t.mrAll).toFixed(1)}%</td>${cell(t.pmayOngoing,true)}${cell(t.pmayMR,true)}<td>${pct(t.pmayMR,t.pmayOngoing).toFixed(1)}%</td>${cell(t.ekLabour,true)}${cell(t.ekOngoing,true)}${cell(t.ekMR,true)}<td>${pct(t.ekMR,t.ekOngoing).toFixed(1)}%</td></tr></tbody>`;$('reportTable').innerHTML=h}
function standardTable(data,cols,title){lastExport=data;$('viewTitle').textContent=title;$('viewMeta').textContent=`${fmt(data.length)} rows • ${todayDate()}`;const nums=new Set(cols.filter(x=>x[2]).map(x=>x[0]));let h='<thead><tr>'+cols.map(c=>`<th>${c[1]}</th>`).join('')+'<th>MR Coverage</th></tr></thead><tbody>';for(const r of data){h+='<tr>'+cols.map(c=>cell(r[c[0]],nums.has(c[0]))).join('')+`<td>${badge(r.worksMR,r.ongoing)}</td></tr>`}const total={};nums.forEach(k=>total[k]=sum(data,k));h+=`<tr class="total-row">${cols.map((c,i)=>`<td>${i===0?'TOTAL':nums.has(c[0])?fmt(total[c[0]]):''}</td>`).join('')}<td>${pct(total.worksMR,total.ongoing).toFixed(1)}%</td></tr></tbody>`;$('reportTable').innerHTML=h}

function mandaysGenerationData(){
 const d=$('districtFilter').value,j=$('janpadFilter').value,e=$('engineerFilter').value,c=$('clusterFilter').value;
 const src=ongoingDetails.filter(r=>(d==='ALL'||districtOf(r.janpad)===d)&&(j==='ALL'||r.janpad===j)&&(e==='ALL'||r.engineer===e)&&(c==='ALL'||r.cluster===c));
 const gp=new Map();
 for(const r of src){
   const key=[r.janpad,r.engineer,r.panchayat].join('¦');
   if(!gp.has(key))gp.set(key,{district:districtOf(r.janpad),janpad:r.janpad,engineer:r.engineer,panchayat:r.panchayat,clusters:new Set(),aprJun:0,julToday:0,allWorks:0,ekWorks:0,hasEk:false});
   const q=gp.get(key);q.clusters.add(clean(r.cluster));q.aprJun=Math.max(q.aprJun,num(r.nregaAprJunMandays));q.julToday=Math.max(q.julToday,num(r.julyMandays));q.allWorks++;
   const cat=clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy);if(cat==='Ek Bagiya Maa Ke Naam'||cat==='Ek Bagiya'){q.hasEk=true;q.ekWorks++}
 }
 const em=new Map();
 for(const q of gp.values()){
   const key=[q.district,q.janpad,q.engineer].join('¦');
   if(!em.has(key))em.set(key,{district:q.district,janpad:q.janpad,engineer:q.engineer,clusters:new Set(),totalGP:0,aprJunMandays:0,nilJunGP:0,julTodayMandays:0,zeroJulGP:0,ekGP:0,ekWorks:0,ekNilJunGP:0,ekZeroJulGP:0,nilNames:[],zeroJulNames:[],ekZeroJulNames:[]});
   const z=em.get(key);q.clusters.forEach(x=>x&&z.clusters.add(x));z.totalGP++;z.aprJunMandays+=q.aprJun;z.julTodayMandays+=q.julToday;if(q.aprJun===0){z.nilJunGP++;z.nilNames.push(q.panchayat)}if(q.julToday===0){z.zeroJulGP++;z.zeroJulNames.push(q.panchayat)}
   if(q.hasEk){z.ekGP++;z.ekWorks+=q.ekWorks;if(q.aprJun===0)z.ekNilJunGP++;if(q.julToday===0){z.ekZeroJulGP++;z.ekZeroJulNames.push(q.panchayat)}}
 }
 return [...em.values()].map(r=>({...r,cluster:[...r.clusters].sort((a,b)=>a.localeCompare(b,'hi')).join(', '),nilJunPct:r.totalGP?r.nilJunGP*100/r.totalGP:0,zeroJulPct:r.totalGP?r.zeroJulGP*100/r.totalGP:0,ekZeroJulPct:r.ekGP?r.ekZeroJulGP*100/r.ekGP:0,nilGPNames:r.nilNames.sort().join(', '),zeroJulGPNames:r.zeroJulNames.sort().join(', '),ekZeroJulGPNames:r.ekZeroJulNames.sort().join(', ')})).sort((a,b)=>num(b.zeroJulGP)-num(a.zeroJulGP)||num(b.ekZeroJulGP)-num(a.ekZeroJulGP)||clean(a.janpad).localeCompare(clean(b.janpad),'hi')||clean(a.engineer).localeCompare(clean(b.engineer),'hi'));
}
function renderMandaysGeneration(){
 const data=mandaysGenerationData();lastExport=data;$('viewTitle').textContent='Mandays Generation — Sub Engineer-wise GP Monitoring';
 $('viewMeta').textContent=`All ongoing work types + Ek Bagiya separate • 30-Jun NIL GP and 01-Jul–Today Zero GP • ${todayDate()}`;
 let h=`<thead><tr><th rowspan="2">District</th><th rowspan="2">Janpad</th><th rowspan="2">Sub Engineer</th><th rowspan="2">Cluster(s)</th><th colspan="5">All Types of Ongoing Works — GP</th><th colspan="3">Mandays Period</th><th colspan="5">Ek Bagiya — GP Zero Monitoring</th></tr><tr><th>Total GP</th><th>NIL GP<br>till 30 Jun</th><th>NIL GP Names<br>till 30 Jun</th><th>Zero GP<br>01 Jul–Today</th><th>Zero GP Names<br>01 Jul–Today</th><th>NREGA Mandays<br>01 Apr–30 Jun</th><th>Mandays<br>01 Jul–Today</th><th>Zero GP %<br>01 Jul–Today</th><th>Ek Bagiya Works</th><th>Ek Bagiya GP</th><th>NIL GP<br>till 30 Jun</th><th>Zero GP<br>01 Jul–Today</th><th>Ek Bagiya Zero GP Names<br>01 Jul–Today</th></tr></thead><tbody>`;
 for(const r of data){h+=`<tr>${cell(r.district)}${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.totalGP,true)}<td class="${r.nilJunGP?'bucket-zero':''}">${fmt(r.nilJunGP)}</td>${cell(r.nilGPNames)}<td class="${r.zeroJulGP?'bucket-zero':''}">${fmt(r.zeroJulGP)}</td>${cell(r.zeroJulGPNames)}${cell(r.aprJunMandays,true)}${cell(r.julTodayMandays,true)}<td>${r.zeroJulPct.toFixed(1)}%</td>${cell(r.ekWorks,true)}${cell(r.ekGP,true)}<td class="${r.ekNilJunGP?'bucket-zero':''}">${fmt(r.ekNilJunGP)}</td><td class="${r.ekZeroJulGP?'bucket-zero':''}">${fmt(r.ekZeroJulGP)}</td>${cell(r.ekZeroJulGPNames)}</tr>`}
 const t={};['totalGP','nilJunGP','zeroJulGP','aprJunMandays','julTodayMandays','ekWorks','ekGP','ekNilJunGP','ekZeroJulGP'].forEach(k=>t[k]=sum(data,k));const zp=t.totalGP?t.zeroJulGP*100/t.totalGP:0;
 h+=`<tr class="total-row"><td>TOTAL</td><td></td><td></td><td></td>${cell(t.totalGP,true)}${cell(t.nilJunGP,true)}<td></td>${cell(t.zeroJulGP,true)}<td></td>${cell(t.aprJunMandays,true)}${cell(t.julTodayMandays,true)}<td>${zp.toFixed(1)}%</td>${cell(t.ekWorks,true)}${cell(t.ekGP,true)}${cell(t.ekNilJunGP,true)}${cell(t.ekZeroJulGP,true)}<td></td></tr>`;
 if(!data.length)h+=`<tr><td colspan="17" class="empty-table">Current filter में Mandays Generation data नहीं मिला।</td></tr>`;h+='</tbody>';$('reportTable').innerHTML=h;
}

function renderCategorySubEngineer(){
 const src=categoryFiltered();const data=aggregate(src,['category','janpad','engineer','cluster'],['workCount','totalSanction','totalBooked','nregaAprJunMandays','julyMandays','b0','b25','b60','b75','b90','b90p']);
 data.forEach(r=>{r.remaining=Math.max(0,r.totalSanction-r.totalBooked);r.expPct=r.totalSanction?r.totalBooked*100/r.totalSanction:0});data.sort((a,b)=>clean(a.category).localeCompare(clean(b.category),'hi')||clean(a.janpad).localeCompare(clean(b.janpad),'hi')||clean(a.engineer).localeCompare(clean(b.engineer),'hi'));lastExport=data;
 $('viewTitle').textContent='Work Category × Sub Engineer — Corrected Master';$('viewMeta').textContent=`${fmt(data.length)} Category/Sub Engineer rows • Corrected Final Work Category • Mapped Booked values • ${todayDate()}`;
 let h=`<thead><tr><th>Work Category</th><th>District</th><th>Janpad</th><th>Sub Engineer</th><th>Cluster</th><th>Works</th><th>NREGA Mandays<br>01 Apr–30 Jun</th><th>Mandays<br>01 Jul–Today</th><th>0%</th><th>1–25%</th><th>26–60%</th><th>61–75%</th><th>76–90%</th><th>&gt;90%</th><th>Sanction ₹ Lakh</th><th>Booked ₹ Lakh</th><th>Remaining ₹ Lakh</th><th>Exp %</th></tr></thead><tbody>`;
 for(const r of data){h+=`<tr>${cell(r.category)}${cell(districtOf(r.janpad))}${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.workCount,true)}${cell(r.nregaAprJunMandays,true)}${cell(r.julyMandays,true)}<td class="bucket-zero">${fmt(r.b0)}</td>${cell(r.b25,true)}${cell(r.b60,true)}${cell(r.b75,true)}${cell(r.b90,true)}<td class="bucket-good">${fmt(r.b90p)}</td><td>${moneyLakh(r.totalSanction)}</td><td>${moneyLakh(r.totalBooked)}</td><td>${moneyLakh(r.remaining)}</td><td><span class="exp-pct-chip ${r.expPct===0?'critical':r.expPct<=25?'low':r.expPct>90?'good':''}">${r.expPct.toFixed(1)}%</span></td></tr>`}
 const t={};['workCount','nregaAprJunMandays','julyMandays','b0','b25','b60','b75','b90','b90p','totalSanction','totalBooked'].forEach(k=>t[k]=sum(data,k));t.remaining=Math.max(0,t.totalSanction-t.totalBooked);const ep=t.totalSanction?t.totalBooked*100/t.totalSanction:0;h+=`<tr class="total-row"><td>TOTAL</td><td></td><td></td><td></td><td></td>${cell(t.workCount,true)}${cell(t.nregaAprJunMandays,true)}${cell(t.julyMandays,true)}${cell(t.b0,true)}${cell(t.b25,true)}${cell(t.b60,true)}${cell(t.b75,true)}${cell(t.b90,true)}${cell(t.b90p,true)}<td>${moneyLakh(t.totalSanction)}</td><td>${moneyLakh(t.totalBooked)}</td><td>${moneyLakh(t.remaining)}</td><td>${ep.toFixed(1)}%</td></tr>`;if(!data.length)h+=`<tr><td colspan="18" class="empty-table">Current filter में Category × Sub Engineer data नहीं मिला।</td></tr>`;h+='</tbody>';$('reportTable').innerHTML=h;
}
function renderCategoryWorks(){
 const data=correctedWorkFiltered().slice().sort((a,b)=>(clean(a.finalCategory)||finalWorkCategory(a.name,a.type,a.fy)).localeCompare((clean(b.finalCategory)||finalWorkCategory(b.name,b.type,b.fy)),'hi')||clean(a.janpad).localeCompare(clean(b.janpad),'hi')||clean(a.engineer).localeCompare(clean(b.engineer),'hi')||clean(a.code).localeCompare(clean(b.code)));lastExport=data;
 const cats=new Set(data.map(r=>clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy)));$('viewTitle').textContent='Category-wise Ongoing Work Details';$('viewMeta').textContent=`${fmt(data.length)} works • ${fmt(cats.size)} categories • Corrected Final Work Category • Work-level drill-down • ${todayDate()}`;
 let h=`<thead><tr><th>S.No.</th><th>Work Category</th><th>District</th><th>Janpad</th><th>Sub Engineer</th><th>Cluster</th><th>GP</th><th>FY</th><th>Work Code</th><th>Work Name</th><th>Sanction ₹</th><th>Booked Wage ₹</th><th>Booked Material ₹</th><th>Total Booked ₹</th><th>Exp %</th><th>NREGA Mandays<br>01 Apr–30 Jun</th><th>Mandays<br>01 Jul–Today</th></tr></thead><tbody>`;
 data.forEach((r,i)=>{const cat=clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy);h+=`<tr>${cell(i+1,true)}${cell(cat)}${cell(districtOf(r.janpad))}${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.panchayat)}${cell(r.fy)}${cell(r.code)}${cell(r.name)}<td>${num(r.sanction).toLocaleString('en-IN',{maximumFractionDigits:2})}</td><td>${num(r.bookedWage).toLocaleString('en-IN',{maximumFractionDigits:2})}</td><td>${num(r.bookedMaterial).toLocaleString('en-IN',{maximumFractionDigits:2})}</td><td>${num(r.booked).toLocaleString('en-IN',{maximumFractionDigits:2})}</td><td>${num(r.expPct).toFixed(1)}%</td>${cell(r.nregaAprJunMandays,true)}${cell(r.julyMandays,true)}</tr>`});if(!data.length)h+=`<tr><td colspan="17" class="empty-table">Current filter/category में work नहीं मिला।</td></tr>`;h+='</tbody>';$('reportTable').innerHTML=h;
}
function render(){document.body.dataset.reportView=view;if(view==='trends'&&window.SRDM_renderTrends)return window.SRDM_renderTrends();const list=filteredRows();$('reportDate').textContent=todayDate();kpis(list);renderAlerts(list);$('reportTable').className='report-table '+(view==='dysjanpad'?'dysfunctional-grid':view==='emuster'?'emuster-grid':view==='state'?'emuster-grid':view==='official'?'official-grid':view==='engineer'?'engineer-grid':view==='district'?'district-grid':view==='priority'?'priority-grid':view==='dysfunctional'?'dysfunctional-grid':view==='category'?'category-grid':view==='categorysubeng'?'category-grid':view==='categoryworks'?'ongoing-detail-grid':view==='mandaysgen'?'category-grid':view==='expbucket'?'expbucket-grid':view==='ongoingall'?'ongoing-summary-grid':view==='ongoingdetails'?'ongoing-detail-grid':view==='ekbagiya'?'ekbagiya-grid':'gp-grid');if(view==='dysjanpad')return renderJanpadDysfunctional();if(view==='emuster')return renderEmuster();if(view==='state')return renderStateDistrict();if(view==='official')return renderOfficial();if(view==='ekbagiya')return renderEkBagiyaDashboard();if(view==='ongoingall')return renderOngoingAllSummary();if(view==='ongoingdetails')return renderOngoingDetails();if(view==='category')return renderCategoryBuckets();if(view==='categorysubeng')return renderCategorySubEngineer();if(view==='categoryworks')return renderCategoryWorks();if(view==='mandaysgen')return renderMandaysGeneration();if(view==='expbucket')return renderExpBuckets();if(view==='priority')return renderPriorityAlerts(list);if(view==='dysfunctional')return renderDysfunctionalBucket(list);if(view==='engineer')return renderEngineerOfficial();if(view==='district'){if($('engineerFilter').value==='ALL'&&$('clusterFilter').value==='ALL'&&daily.length){const dd=dailyFiltered().map(r=>({...r,district:districtOf(r.janpad)}));const d=aggregate(dd,['district'],['totalGP','gpsProgress','labour','worksMR','mrs','noEkyc']);const om=aggregate(officialFiltered().map(r=>({...r,district:districtOf(r.janpad)})),['district'],['ongoingAll']);const ox=new Map(om.map(r=>[r.district,r.ongoingAll]));d.forEach(r=>r.ongoing=ox.get(r.district)||0);return standardTable(d,[['district','District'],['totalGP','Total GP',1],['gpsProgress','GP Progress',1],['labour','Labour',1],['ongoing','Ongoing Works',1],['worksMR','Works with MR',1],['mrs','Muster Rolls',1]],'Full District Report: Screen 2 Matched')}const d=aggregate(list.map(r=>({...r,district:districtOf(r.janpad)})),['district'],['gps','gpsProgress','ongoing','worksMR','labour','mrs','noEkyc']);return standardTable(d,[['district','District'],['gps','Total GP',1],['gpsProgress','GP Progress',1],['labour','Labour',1],['ongoing','Ongoing Works',1],['worksMR','Works with MR',1],['mrs','Muster Rolls',1]],'Full District Report')}return standardTable(list,[['janpad','Janpad'],['engineer','Engineer'],['cluster','Cluster'],['panchayat','Gram Panchayat'],['labour','Labour',1],['ongoing','Ongoing Works',1],['worksMR','Works with MR',1],['mrs','Muster Rolls',1]],'Gram Panchayat Detail')}
function sheetArray(wb,name){const s=wb.Sheets[name];return s?XLSX.utils.sheet_to_json(s,{header:1,defval:''}):[]}
function parseWorkbook(wb){const a=sheetArray(wb,'RepDay');if(!a.length)throw new Error('RepDay sheet नहीं मिली।');reportTitle=clean(a?.[0]?.[0]);rows=[];for(let i=3;i<a.length;i++){const r=a[i];if(!clean(r[0])||!clean(r[1])||!clean(r[5]))continue;rows.push({janpad:normJanpad(r[0]),engineer:clean(r[1]),cluster:clean(r[2]),ongoing:num(r[3]),panchayat:clean(r[5]).toUpperCase(),gps:num(r[6]),gpsProgress:num(r[7]),labour:num(r[8]),worksMR:num(r[9]),noEkyc:num(r[10]),mrs:num(r[11])})}
 const s1=sheetArray(wb,'Sheet1');official=[];for(const ix of [3,4,5,7,8,9,10,11]){const r=s1[ix]||[];if(!clean(r[1]))continue;official.push({janpad:normJanpad(r[1]),totalGP:num(r[2]),musterGP:num(r[3]),dysfunctionalGP:num(r[4]),labourAll:num(r[6]),mrAll:num(r[7]),ongoingAll:num(r[8]),labourIndividual:num(r[10]),mrIndividual:num(r[11]),labourCommunity:num(r[12]),mrCommunity:num(r[13]),pmayOngoing:num(r[15]),pmayMR:num(r[16]),ekLabour:num(r[18]),ekOngoing:num(r[19]),ekMR:num(r[20])})}
 daily=[];let hix=s1.findIndex(r=>clean(r?.[2]).toLowerCase().includes('total no. of gram panchayats'));if(hix>=0){for(let i=hix+2;i<s1.length;i++){const r=s1[i]||[],j=clean(r[1]).toUpperCase();if(!j||j==='TOTAL')continue;if(!MAIHAR.has(j)&&!SATNA.has(j))continue;daily.push({janpad:j,totalGP:num(r[2]),gpsProgress:num(r[3]),labour:num(r[4]),worksMR:num(r[6]),noEkyc:num(r[7]),mrs:num(r[8])})}}
 const gpmap=new Map(rows.map(r=>[[r.janpad,r.panchayat].join('¦'),[r.engineer,r.cluster]]));workmix=[];categorymix=[];ongoingDetails=[];const wm=new Map(),cm=new Map(),v=sheetArray(wb,'VBG');const expBucket=p=>p<=0?'b0':p<=25?'b25':p<=60?'b60':p<=75?'b75':p<=90?'b90':'b90p';for(let i=4;i<v.length;i++){const r=v[i],jan=normJanpad(r[2]),gp=clean(r[3]).toUpperCase(),fy=clean(r[4]),status=clean(r[5]).toLowerCase(),code=clean(r[6]),name=clean(r[7]),wt=clean(r[8]);if(!jan||!gp||!code||!status.includes('ongoing'))continue;const ec=gpmap.get([jan,gp].join('¦'))||['Unmapped','Unmapped'],key=[jan,ec[0],ec[1],gp].join('¦');if(!wm.has(key))wm.set(key,{janpad:jan,engineer:ec[0],cluster:ec[1],panchayat:gp,workTotal:0,pmayOngoing:0,ekOngoing:0,currentFYActive:0});const z=wm.get(key);z.workTotal++;if(wt.toLowerCase().includes('pmay'))z.pmayOngoing++;if(finalWorkCategory(name,wt,fy)==='Ek Bagiya')z.ekOngoing++;if(num(r[21])>0)z.currentFYActive++;const cat=finalWorkCategory(name,wt,fy),sanction=num(r[11])||num(r[9])+num(r[10]),booked=num(r[16])+num(r[17]),ep=sanction?booked*100/sanction:0;ongoingDetails.push({sno:ongoingDetails.length+1,district:districtOf(jan),janpad:jan,engineer:ec[0],cluster:ec[1],panchayat:gp,fy:fy,status:clean(r[5]),code:code,name:name,type:wt,sanction:sanction,booked:booked,expPct:ep,mandays:num(r[20]),currentFYMandays:num(r[21])});const ck=[jan,ec[0],ec[1],gp,cat].join('¦');if(!cm.has(ck))cm.set(ck,{janpad:jan,engineer:ec[0],cluster:ec[1],panchayat:gp,category:cat,workCount:0,totalSanction:0,totalBooked:0,b0:0,b25:0,b60:0,b75:0,b90:0,b90p:0});const q=cm.get(ck);q.workCount++;q.totalSanction+=sanction;q.totalBooked+=booked;q[expBucket(ep)]++}workmix=[...wm.values()];categorymix=[...cm.values()];if(ongoingDetails.length)rebuildCorrectedWorkData();if(!rows.length)throw new Error('RepDay में usable data नहीं मिला।')}

function portalJanpadLabel(j){
  const x=JANPAD_PORTAL.find(q=>q.janpad===j);
  return x?x.label:j;
}
function updatePortalHeading(){
  const j=$('janpadFilter')?.value||'ALL';
  const d=$('districtFilter')?.value||'ALL';
  const h=$('portalHeading'),s=$('portalSubheading'),t=$('selectedJanpadTitle'),sd=$('selectedJanpadDistrict');
  if(j!=='ALL'){
    const dist=districtOf(j),lab=portalJanpadLabel(j);
    if(h)h.textContent=`जनपद पंचायत ${lab}, जिला ${dist==='MAIHAR'?'मैहर':'सतना'} (म.प्र.)`;
    if(s)s.textContent=`VB-G RAM G • ${j} • Daily Monitoring • srdmsatna.online`;
    if(t)t.textContent=`जनपद ${lab} — ${j}`;
    if(sd)sd.textContent=`DISTRICT ${dist}`;
  }else if(d!=='ALL'){
    if(h)h.textContent=`District ${d==='MAIHAR'?'Maihar':'Satna'} — VB-G RAM G Daily Monitoring`;
    if(s)s.textContent=`${d==='MAIHAR'?'3':'5'} Janpad • Official Daily Report • srdmsatna.online`;
    if(t)t.textContent=`DISTRICT ${d}`;
    if(sd)sd.textContent=`${d==='MAIHAR'?'3':'5'} Janpad`;
  }else{
    if(h)h.textContent='जिला सतना एवं मैहर — 8 जनपद डेली मॉनिटरिंग';
    if(s)s.textContent='srdmsatna.online • Official Daily Report • Engineer • Cluster • GP';
    if(t)t.textContent='सभी 8 जनपद';
    if(sd)sd.textContent='District Maihar + District Satna';
  }
  updateQuickScope();
  updatePremiumHero();
  document.querySelectorAll('[data-janpad-home]').forEach(b=>{
    const v=b.dataset.janpadHome;
    b.classList.toggle('active',v===j || (v==='ALL'&&j==='ALL'&&d==='ALL'));
  });
}

function updateQuickScope(){
  const j=$('janpadFilter')?.value||'ALL';
  const d=$('districtFilter')?.value||'ALL';
  const qd=$('quickDistrictName'), qs=$('quickJanpadScope');
  if(!qd||!qs) return;
  if(j!=='ALL'){ qd.textContent = districtOf(j)==='MAIHAR' ? 'DISTRICT MAIHAR' : 'DISTRICT SATNA'; qs.textContent = j; }
  else if(d!=='ALL'){ qd.textContent = d==='MAIHAR' ? 'DISTRICT MAIHAR' : 'DISTRICT SATNA'; qs.textContent = d==='MAIHAR' ? '3 Janpad' : '5 Janpad'; }
  else { qd.textContent='SATNA + MAIHAR'; qs.textContent='8 Janpad'; }
}
function setPortalJanpad(j,scroll=true){
  j=normJanpad(j||'ALL');
  if(j==='ALL'){
    $('districtFilter').value='ALL';
    refreshFilters();
    $('janpadFilter').value='ALL';
  }else{
    const d=districtOf(j);
    $('districtFilter').value=d;
    refreshFilters();
    $('janpadFilter').value=j;
    refreshFilters();
  }
  $('engineerFilter').value='ALL';
  $('clusterFilter').value='ALL';
  if($('categoryFilter'))$('categoryFilter').value='ALL';
  const url=new URL(window.location.href);
  if(j==='ALL')url.searchParams.delete('janpad');else url.searchParams.set('janpad',j);
  history.replaceState(null,'',url.pathname+(url.search?'?'+url.searchParams.toString():''));
  updatePortalHeading();
  render();
  if(scroll)document.querySelector('.auto-card')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function initJanpadPortal(){
  document.querySelectorAll('[data-janpad-home]').forEach(b=>b.addEventListener('click',()=>setPortalJanpad(b.dataset.janpadHome)));
  $('changeJanpadBtn')?.addEventListener('click',()=>document.getElementById('janpadHome')?.scrollIntoView({behavior:'smooth'}));
  const q=normJanpad(new URLSearchParams(location.search).get('janpad')||'ALL');
  if(q!=='ALL' && JANPAD_PORTAL.some(x=>x.janpad===q)){
    $('districtFilter').value=districtOf(q);
    refreshFilters();
    $('janpadFilter').value=q;
    refreshFilters();
  }
  updatePortalHeading();
}

$('fileInput').addEventListener('change',e=>{pendingFile=e.target.files[0]||null;$('fileStatus').textContent=pendingFile?`Selected: ${pendingFile.name}`:'कोई file नहीं चुनी गई'});$('generateBtn').addEventListener('click',async()=>{if(!pendingFile){render();return}try{if(typeof XLSX==='undefined')throw new Error('Excel reader load नहीं हुआ।');$('fileStatus').textContent='Excel पढ़ी जा रही है…';const buf=await pendingFile.arrayBuffer();parseWorkbook(XLSX.read(buf,{type:'array'}));autoMeta={mode:'manual',updatedAt:new Date().toISOString(),source:pendingFile.name,status:'manual'};refreshFilters();updatePortalHeading();render();updateAutoStatus();$('fileStatus').textContent=`Generated: ${pendingFile.name} • ${fmt(rows.length)} GP rows`}catch(e){$('fileStatus').textContent='Error: '+e.message;alert(e.message)}});
['districtFilter','janpadFilter','engineerFilter','clusterFilter','categoryFilter'].forEach(id=>$(id).addEventListener('change',()=>{
  refreshFilters();
  if(id==='janpadFilter'){
    const j=$('janpadFilter').value;
    const url=new URL(location.href);
    if(j==='ALL')url.searchParams.delete('janpad');else url.searchParams.set('janpad',j);
    history.replaceState(null,'',url.pathname+(url.search?'?'+url.searchParams.toString():''));
  }
  updatePortalHeading();
  render();
}));$('resetBtn').addEventListener('click',()=>{if($('sortMetric'))$('sortMetric').value='AUTO';if($('sortOrder'))$('sortOrder').value='DESC';setPortalJanpad('ALL',false);});$('printBtn').addEventListener('click',()=>window.print());document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',async()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');view=b.dataset.view;const o=$('printOrientation');if(o){o.value='landscape';o.dispatchEvent(new Event('change'));}if(ONGOING_HEAVY_VIEWS.has(view)){try{await ensureOngoingDetails()}catch(e){$('viewTitle').textContent='Work data unavailable';$('viewMeta').textContent=e.message;return;}}render()}));
$('csvBtn').addEventListener('click',()=>{if(!lastExport.length)return;const keys=Object.keys(lastExport[0]);const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';const csv='\ufeff'+[keys.join(','),...lastExport.map(r=>keys.map(k=>q(r[k])).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`daily-report-${view}-${todayDate()}.csv`;a.click();URL.revokeObjectURL(a.href)});initPortalLogin();refreshFilters();initJanpadPortal();initPremiumUI();initPptExportUI();render();updateAutoStatus();
// V6: Font size and Portrait/Landscape print controls
(function(){
  let fontScale=1;
  const root=document.documentElement;
  const minus=document.getElementById('fontMinusBtn');
  const plus=document.getElementById('fontPlusBtn');
  const orient=document.getElementById('printOrientation');
  const printBtn=document.getElementById('printBtn');
  function applyScale(){root.style.setProperty('--table-font-scale',fontScale.toFixed(2));}
  minus?.addEventListener('click',()=>{fontScale=Math.max(.75,+(fontScale-.10).toFixed(2));applyScale();});
  plus?.addEventListener('click',()=>{fontScale=Math.min(1.60,+(fontScale+.10).toFixed(2));applyScale();});
  function setPrintOrientation(){
    const mode=orient?.value==='landscape'?'landscape':'portrait';
    document.body.classList.toggle('print-portrait',mode==='portrait');
    document.body.classList.toggle('print-landscape',mode==='landscape');
    let st=document.getElementById('dynamicPrintPageStyle');
    if(!st){st=document.createElement('style');st.id='dynamicPrintPageStyle';document.head.appendChild(st);}
    st.textContent=`@media print{@page{size:A4 ${mode};margin:7mm}}`;
  }
  orient?.addEventListener('change',setPrintOrientation);
  if(printBtn){
    const cloned=printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(cloned,printBtn);
    cloned.addEventListener('click',()=>{setPrintOrientation();setTimeout(()=>window.print(),30);});
  }
  setPrintOrientation();applyScale();
})();


function updatePremiumHero(){
  const j=$('janpadFilter')?.value||'ALL';
  const d=$('districtFilter')?.value||'ALL';
  const ht=$('heroJanpadTitle'), hs=$('heroJanpadSub');
  if(!ht||!hs)return;
  if(j!=='ALL'){
    const dist=districtOf(j), lab=portalJanpadLabel(j);
    ht.textContent=`${j} • ${dist}`;
    hs.textContent=`जनपद पंचायत ${lab} • Daily Monitoring • Official Source`;
    document.body.dataset.district=dist;
  }else if(d!=='ALL'){
    ht.textContent=`DISTRICT ${d} • ${d==='MAIHAR'?'3':'5'} JANPAD`;
    hs.textContent=`${d==='MAIHAR'?'Amarpatan • Maihar • Ramnagar':'Majhgawan • Nagod • Rampur Baghelan • Satna • Unchahara'}`;
    document.body.dataset.district=d;
  }else{
    ht.textContent='SATNA + MAIHAR • 8 JANPAD';
    hs.textContent='Official Daily Monitoring • Engineer • Cluster • Gram Panchayat';
    document.body.dataset.district='ALL';
  }
}
function initPremiumUI(){
  $('heroDataBtn')?.addEventListener('click',()=>document.querySelector('.kpis')?.scrollIntoView({behavior:'smooth',block:'start'}));
  document.querySelectorAll('[data-review-view]').forEach(b=>b.addEventListener('click',()=>{
    const v=b.dataset.reviewView;
    document.querySelector(`.tab[data-view="${v}"]`)?.click();
    document.querySelector('.report-card')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  updatePremiumHero();
}


const PORTAL_LOGIN_USER='srdmsatna';
const PORTAL_DEFAULT_PASS='SRDM@2026';
const PORTAL_PASS_KEY='srdmPortalPassword';
function getPortalPassword(){return localStorage.getItem(PORTAL_PASS_KEY)||PORTAL_DEFAULT_PASS;}
function setPortalPassword(v){localStorage.setItem(PORTAL_PASS_KEY,v);}
function openPortal(){
  const s=$('loginScreen'); if(s)s.classList.add('hidden');
  document.body.classList.remove('login-locked');
  sessionStorage.setItem('srdmPortalLogin','1');
}
function closePortal(){
  sessionStorage.removeItem('srdmPortalLogin');
  const s=$('loginScreen'); if(s)s.classList.remove('hidden');
  document.body.classList.add('login-locked');
  const p=$('loginPassword'); if(p)p.value='';
}
function tryPortalLogin(){
  const u=($('loginUsername')?.value||'').trim();
  const p=$('loginPassword')?.value||'';
  const e=$('loginError');
  if(u===PORTAL_LOGIN_USER && p===getPortalPassword()){ if(e)e.classList.remove('show'); openPortal(); }
  else { if(e)e.classList.add('show'); $('loginPassword')?.focus(); }
}
function showPasswordModal(){
  const m=$('passwordModal'); if(!m)return;
  ['currentPassword','newPassword','confirmPassword'].forEach(id=>{const x=$(id);if(x)x.value='';});
  const msg=$('passwordMessage');if(msg){msg.textContent='';msg.className='password-message';}
  m.classList.remove('hidden');
  setTimeout(()=>$('currentPassword')?.focus(),20);
}
function hidePasswordModal(){ $('passwordModal')?.classList.add('hidden'); }
function savePortalPassword(){
  const current=$('currentPassword')?.value||'';
  const next=$('newPassword')?.value||'';
  const confirm=$('confirmPassword')?.value||'';
  const msg=$('passwordMessage');
  const fail=t=>{if(msg){msg.textContent=t;msg.className='password-message error';}};
  if(current!==getPortalPassword())return fail('Current Password गलत है।');
  if(next.length<6)return fail('New Password कम से कम 6 characters का रखें।');
  if(next!==confirm)return fail('New Password और Confirm Password match नहीं कर रहे हैं।');
  if(next===current)return fail('New Password पुराने password से अलग रखें।');
  setPortalPassword(next);
  if(msg){msg.textContent='Password successfully changed.';msg.className='password-message success';}
  setTimeout(hidePasswordModal,800);
}
function initPortalLogin(){
  if(sessionStorage.getItem('srdmPortalLogin')==='1') openPortal(); else closePortal();
  $('loginBtn')?.addEventListener('click',tryPortalLogin);
  $('logoutBtn')?.addEventListener('click',closePortal);
  $('changePasswordBtn')?.addEventListener('click',showPasswordModal);
  $('closePasswordBtn')?.addEventListener('click',hidePasswordModal);
  $('cancelPasswordBtn')?.addEventListener('click',hidePasswordModal);
  $('savePasswordBtn')?.addEventListener('click',savePortalPassword);
  $('passwordModal')?.addEventListener('click',e=>{if(e.target===$('passwordModal'))hidePasswordModal();});
  ['currentPassword','newPassword','confirmPassword'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')savePortalPassword();}));
  ['loginUsername','loginPassword'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')tryPortalLogin()}));
}


function currentScopeText(){
  const d=$('districtFilter')?.value||'ALL';
  const j=$('janpadFilter')?.value||'ALL';
  const e=$('engineerFilter')?.value||'ALL';
  const c=$('clusterFilter')?.value||'ALL';
  const parts=[];
  if(d!=='ALL')parts.push(`District: ${d}`);
  if(j!=='ALL')parts.push(`Janpad: ${j}`);
  if(e!=='ALL')parts.push(`Engineer: ${e}`);
  if(c!=='ALL')parts.push(`Cluster: ${c}`);
  return parts.length?parts.join(' • '):'All District • All Janpad • All Engineer • All Cluster';
}
function pptCellText(v){
  if(v===null||v===undefined)return '';
  if(Array.isArray(v))return v.join(', ');
  if(typeof v==='object'){
    if(v.panchayat)return `${v.panchayat} (Ongoing ${v.ongoing||0}, MR ${v.worksMR||0})`;
    return Object.values(v).join(' ');
  }
  return String(v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
function pickPptColumns(rows){
  if(!rows||!rows.length)return [];
  const preferred = [
    ['janpad','Janpad'],['rank','Rank'],['engineer','Sub Engineer'],['cluster','Cluster'],
    ['panchayat','Gram Panchayat'],['totalGP','Total GP'],['gpProgress','GP Progress'],
    ['dysfunctionalGP','Dys GP'],['ongoing','Ongoing'],['worksMR','Works with MR'],
    ['labour','Labour'],['mrs','Muster Rolls'],['mrCoverage','MR %'],
    ['totalJanpadDys','Janpad Dys GP'],['alert','Alert'],['severity','Severity'],
    ['category','Category'],['workType','Work Type'],['workCount','Works'],['workName','Work Name'],
    ['workCode','Work Code']
  ];
  const keys = Object.keys(rows[0]||{});
  const cols = preferred.filter(([k])=>keys.includes(k));
  for(const k of keys){
    if(cols.length>=9)break;
    if(!cols.some(([x])=>x===k) && !['dysGpRows','dysGpDetails'].includes(k)){
      cols.push([k,k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())]);
    }
  }
  return cols.slice(0,9);
}
function addPptTable(ppt, rows, title, subtitle, pageSet){
  const isWide=pageSet!=='standard';
  const slide=ppt.addSlide();
  slide.background={color:'F5F8FC'};
  slide.addShape(ppt.ShapeType.rect,{x:0,y:0,w:isWide?13.333:10,h:0.62,fill:{color:'0B3159'},line:{color:'0B3159'}});
  slide.addText('SRDM SATNA • VB-G RAM G DAILY MONITORING',{x:0.32,y:0.16,w:isWide?8.6:6.2,h:0.24,fontSize:10,bold:true,color:'FFFFFF',margin:0});
  slide.addText(todayDate(),{x:isWide?11.1:8.2,y:0.16,w:1.7,h:0.24,fontSize:10,bold:true,color:'FFD36A',align:'right',margin:0});
  slide.addText(title,{x:0.38,y:0.86,w:isWide?12.45:9.2,h:0.38,fontSize:22,bold:true,color:'123F72',margin:0});
  slide.addText(subtitle,{x:0.4,y:1.28,w:isWide?12.2:9.1,h:0.25,fontSize:9.5,color:'52677F',margin:0});

  const cols=pickPptColumns(rows);
  const maxRows=isWide?14:12;
  const safeRows=(rows||[]).slice(0,maxRows);
  const table=[cols.map(([,label])=>({text:label,options:{bold:true,color:'FFFFFF',fill:'1557B0'}}))];
  for(const r of safeRows){
    table.push(cols.map(([k])=>pptCellText(r[k]).slice(0,70)));
  }
  if(!safeRows.length)table.push([{text:'No data in current filter',options:{colSpan:Math.max(1,cols.length),color:'A33'}}]);

  const x=0.38,y=1.72,w=isWide?12.55:9.25;
  const colW=cols.map((c,i)=>{
    const label=c[1].toLowerCase();
    if(label.includes('engineer'))return isWide?1.6:1.15;
    if(label.includes('panchayat')||label.includes('cluster')||label.includes('work'))return isWide?1.85:1.35;
    return isWide?1.05:.78;
  });
  const sum=colW.reduce((a,b)=>a+b,0);
  const widths=colW.map(v=>v*w/sum);
  slide.addTable(table,{x,y,w,h:isWide?4.95:4.2,colW:widths,border:{type:'solid',color:'C8D7E8',pt:.5},fontSize:isWide?7.2:6.3,color:'0B1F33',margin:0.04,fill:'FFFFFF',autoFit:false});
  slide.addText(`Rows shown: ${safeRows.length} of ${(rows||[]).length} • ${currentScopeText()}`,{x:0.42,y:isWide?6.96:6.78,w:isWide?12.2:9.1,h:.22,fontSize:8,color:'60758B',margin:0});
  return slide;
}

function pptLegend(slide,ppt,y=1.49){
  slide.addShape(ppt.ShapeType.ellipse,{x:9.35,y:y+0.02,w:.10,h:.10,fill:{color:'2FA56E'},line:{color:'2FA56E'}});
  slide.addText('Better coverage  ≥ 10%',{x:9.49,y,w:1.55,h:.17,fontSize:7.6,color:'58708A',margin:0});
  slide.addShape(ppt.ShapeType.ellipse,{x:11.12,y:y+0.02,w:.10,h:.10,fill:{color:'E79A16'},line:{color:'E79A16'}});
  slide.addText('Needs attention  < 10%',{x:11.26,y,w:1.62,h:.17,fontSize:7.6,color:'58708A',margin:0});
}
function officialPct(a,b){return b?((Number(a||0)/Number(b||0))*100):0}
function officialTotalRow(data){
  const keys=['totalGP','musterGP','dysfunctionalGP','labourAll','mrAll','noEkyc','mrs','ongoingAll','labourIndividual','mrIndividual','labourCommunity','mrCommunity','pmayOngoing','pmayMR','ekLabour','ekOngoing','ekMR'];
  const t={}; keys.forEach(k=>t[k]=(data||[]).reduce((s,r)=>s+Number(r[k]||0),0)); return t;
}
function officialRowsForPpt(data){
  const out=(data||[]).map(r=>[
    districtOf(r.janpad),r.janpad,
    r.totalGP,r.musterGP,r.dysfunctionalGP,
    r.labourAll,r.mrAll,r.ongoingAll,officialPct(r.mrAll,r.ongoingAll).toFixed(1)+'%',
    r.labourIndividual,r.mrIndividual,
    r.labourCommunity,r.mrCommunity,officialPct(r.mrCommunity,r.mrAll).toFixed(1)+'%',
    r.pmayOngoing,r.pmayMR,officialPct(r.pmayMR,r.pmayOngoing).toFixed(1)+'%',
    r.ekLabour,r.ekOngoing,r.ekMR,officialPct(r.ekMR,r.ekOngoing).toFixed(1)+'%'
  ]);
  const t=officialTotalRow(data);
  out.push([
    'TOTAL','',
    t.totalGP,t.musterGP,t.dysfunctionalGP,
    t.labourAll,t.mrAll,t.ongoingAll,officialPct(t.mrAll,t.ongoingAll).toFixed(1)+'%',
    t.labourIndividual,t.mrIndividual,
    t.labourCommunity,t.mrCommunity,officialPct(t.mrCommunity,t.mrAll).toFixed(1)+'%',
    t.pmayOngoing,t.pmayMR,officialPct(t.pmayMR,t.pmayOngoing).toFixed(1)+'%',
    t.ekLabour,t.ekOngoing,t.ekMR,officialPct(t.ekMR,t.ekOngoing).toFixed(1)+'%'
  ]);
  return out;
}
function addOfficialFullTableSlide(ppt,data,scope){
  const slide=ppt.addSlide(); slide.background={color:'F7FAFE'};
  slide.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.333,h:.58,fill:{color:'0B3159'},line:{color:'0B3159'}});
  slide.addText('Official Janpad Daily Report',{x:.28,y:.12,w:6.0,h:.27,fontSize:17,bold:true,color:'FFFFFF',margin:0});
  slide.addText(scope,{x:6.25,y:.14,w:6.7,h:.22,fontSize:7.8,color:'DDEBFA',align:'right',margin:0});
  slide.addText(`${data.length} Janpad • ${todayDate()}`,{x:.30,y:.72,w:3.1,h:.20,fontSize:8.5,color:'5D7289',margin:0});
  pptLegend(slide,ppt,.71);

  const h1=[
    {text:'District',options:{rowSpan:2,bold:true,color:'FFFFFF',fill:'4A78A8',align:'center',valign:'mid'}},
    {text:'Janpad',options:{rowSpan:2,bold:true,color:'FFFFFF',fill:'4A78A8',align:'center',valign:'mid'}},
    {text:'Gram Panchayat',options:{colSpan:3,bold:true,color:'FFFFFF',fill:'7EA2C8',align:'center'}},
    {text:'All Types of Works',options:{colSpan:4,bold:true,color:'FFFFFF',fill:'7EA2C8',align:'center'}},
    {text:'Individual Land (Cat-IV)',options:{colSpan:2,bold:true,color:'FFFFFF',fill:'7EA2C8',align:'center'}},
    {text:'Community Works',options:{colSpan:3,bold:true,color:'FFFFFF',fill:'7EA2C8',align:'center'}},
    {text:'PMAY-G',options:{colSpan:3,bold:true,color:'FFFFFF',fill:'7EA2C8',align:'center'}},
    {text:'Ek Bagiya',options:{colSpan:4,bold:true,color:'FFFFFF',fill:'7EA2C8',align:'center'}}
  ];
  const h2=['Total GP','GP Progress','Dysfunctional','Labour','Works with MR','Total Ongoing Work','MR %','Labour','Works MR','Labour','Works MR','Share %','Ongoing','MR Issued','MR %','Labour','Ongoing','MR Issued','MR %']
    .map(x=>({text:x,options:{bold:true,fill:'D6E6F8',color:'0A3158',align:'center',valign:'mid'}}));
  const rows=officialRowsForPpt(data);
  const body=rows.map((r,ri)=>r.map((v,ci)=>{
    let fill=ri===rows.length-1?'D9E8F8':(ri%2?'F3F7FC':'FFFFFF');
    let color='172334',bold=ri===rows.length-1;
    if([8,13,16,20].includes(ci)){
      const n=parseFloat(String(v));
      fill=n>=10?'E5F4EC':'FFF2D8';
      color=n>=10?'146C48':'9A5C00';
      bold=true;
    }
    return {text:String(v??''),options:{fill,color,bold,align:ci<2?'left':'center',valign:'mid'}};
  }));
  // JS literal "True" fix after source insertion.
  const table=[h1,h2,...body];
  const widths=[.62,1.00,.52,.52,.67,.54,.55,.58,.46,.54,.55,.54,.55,.48,.58,.55,.46,.54,.55,.55,.46];
  slide.addTable(table,{
    x:.16,y:1.08,w:13.02,h:5.96,
    colW:widths,rowH:[.34,.44,...rows.map(()=>.49)],
    margin:.025,fontSize:5.3,color:'172334',
    border:{type:'solid',color:'7D9BB9',pt:.45},
    autoFit:false,breakLine:false
  });
  slide.addText('Key Indication: Green = MR coverage/share 10% or more • Amber = below 10%',{
    x:.32,y:7.16,w:7.3,h:.17,fontSize:7.2,color:'5C7087',margin:0
  });
}
function addOfficialDetailSlides(ppt,data,scope){
  const common=[
    {key:'district',label:'District'}, {key:'janpad',label:'Janpad'}
  ];
  const sets=[
    {
      title:'Official Janpad Daily Report • Part A',
      groups:'Gram Panchayat • All Types of Works • Individual Land (Cat-IV)',
      headers:['District','Janpad','Total GP','Muster GP','Dysfunctional GP','Labour','Works with MR','Ongoing','MR %','Individual Labour','Individual Works MR'],
      rows:(data||[]).map(r=>[districtOf(r.janpad),r.janpad,r.totalGP,r.musterGP,r.dysfunctionalGP,r.labourAll,r.mrAll,r.ongoingAll,officialPct(r.mrAll,r.ongoingAll).toFixed(1)+'%',r.labourIndividual,r.mrIndividual])
    },
    {
      title:'Official Janpad Daily Report • Part B',
      groups:'Community Works • PMAY-G • Ek Bagiya',
      headers:['District','Janpad','Community Labour','Community Works MR','Share %','PMAY Ongoing','PMAY MR Issued','PMAY MR %','Ek Bagiya Labour','Ek Bagiya Ongoing','Ek Bagiya MR','Ek Bagiya MR %'],
      rows:(data||[]).map(r=>[districtOf(r.janpad),r.janpad,r.labourCommunity,r.mrCommunity,officialPct(r.mrCommunity,r.mrAll).toFixed(1)+'%',r.pmayOngoing,r.pmayMR,officialPct(r.pmayMR,r.pmayOngoing).toFixed(1)+'%',r.ekLabour,r.ekOngoing,r.ekMR,officialPct(r.ekMR,r.ekOngoing).toFixed(1)+'%'])
    }
  ];
  sets.forEach(set=>{
    const slide=ppt.addSlide(); slide.background={color:'F7FAFE'};
    slide.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.333,h:.58,fill:{color:'0B3159'},line:{color:'0B3159'}});
    slide.addText(set.title,{x:.3,y:.12,w:6.3,h:.26,fontSize:17,bold:true,color:'FFFFFF',margin:0});
    slide.addText(scope,{x:7.0,y:.14,w:5.9,h:.2,fontSize:7.8,color:'DDEBFA',align:'right',margin:0});
    slide.addText(set.groups,{x:.32,y:.73,w:7.2,h:.22,fontSize:9,bold:true,color:'123F72',margin:0});
    pptLegend(slide,ppt,.73);
    const table=[
      set.headers.map(h=>({text:h,options:{bold:true,fill:'CFE0F5',color:'0A3158',align:'center',valign:'mid'}})),
      ...set.rows.map((r,ri)=>r.map((v,ci)=>{
        let fill=ri%2?'F3F7FC':'FFFFFF',color='172334',bold=false;
        const sv=String(v??'');
        if(sv.endsWith('%')){
          const n=parseFloat(sv); fill=n>=10?'E5F4EC':'FFF2D8'; color=n>=10?'146C48':'9A5C00'; bold=true;
        }
        return {text:sv,options:{fill,color,bold,align:ci<2?'left':'center',valign:'mid'}};
      }))
    ];
    slide.addTable(table,{x:.35,y:1.15,w:12.62,h:5.5,margin:.04,fontSize:8.1,border:{type:'solid',color:'91A9C0',pt:.5},fill:'FFFFFF',autoFit:false});
    slide.addText('Key Indication: Green = Better coverage (≥10%) • Amber = Needs attention (<10%)',{
      x:.38,y:6.82,w:7.2,h:.2,fontSize:8,color:'5C7087',margin:0
    });
  });
}

function downloadCurrentPpt(){
  if(typeof PptxGenJS==='undefined'){
    alert('PPT library load नहीं हुई। कृपया Ctrl+F5 से page refresh करें।');
    return;
  }
  const pageSet=$('pptPageSet')?.value||'wide';
  const ppt=new PptxGenJS();
  ppt.layout=pageSet==='standard'?'LAYOUT_4X3':'LAYOUT_WIDE';
  ppt.author='SRDM SATNA';
  ppt.company='SRDM SATNA';
  ppt.subject='VB-G RAM G Daily Monitoring';
  ppt.title='SRDM SATNA Daily Report';

  const rows = (lastExport && lastExport.length) ? lastExport : dailyFiltered();
  const viewName=$('viewTitle')?.textContent||'Daily Report';
  const scope=currentScopeText();

  const cover=ppt.addSlide();
  cover.background={color:'0B3159'};
  cover.addShape(ppt.ShapeType.rect,{x:0,y:0,w:pageSet==='standard'?10:13.333,h:7.5,fill:{color:'0B3159'},line:{color:'0B3159'}});
  cover.addText('VB-G RAM G DAILY MONITORING',{x:.55,y:.85,w:pageSet==='standard'?8.9:12.2,h:.35,fontSize:15,bold:true,color:'FFD36A',margin:0});
  cover.addText('SRDM SATNA • DISTRICT SATNA & MAIHAR',{x:.55,y:1.28,w:pageSet==='standard'?8.9:12.2,h:.3,fontSize:10,bold:true,color:'DDEBFA',margin:0});
  cover.addText(viewName,{x:.55,y:2.05,w:pageSet==='standard'?8.8:12,h:.8,fontSize:30,bold:true,color:'FFFFFF',fit:'shrink',margin:0});
  cover.addText(scope,{x:.58,y:3.05,w:pageSet==='standard'?8.6:11.8,h:.35,fontSize:13,color:'DDEBFA',margin:0});
  cover.addText(`Report Date: ${todayDate()}`,{x:.58,y:3.55,w:pageSet==='standard'?8.6:11.8,h:.3,fontSize:12,bold:true,color:'FFD36A',margin:0});
  cover.addShape(ppt.ShapeType.roundRect,{x:pageSet==='standard'?6.5:9.6,y:4.35,w:pageSet==='standard'?2.7:3.0,h:1.45,rectRadius:.12,fill:{color:'FFFFFF',transparency:8},line:{color:'FFFFFF',transparency:50}});
  cover.addText('Designed PPT Export',{x:pageSet==='standard'?6.78:9.88,y:4.73,w:pageSet==='standard'?2.1:2.4,h:.25,fontSize:13,bold:true,color:'0B3159',align:'center',margin:0});
  cover.addText('srdmsatna.online',{x:pageSet==='standard'?6.78:9.88,y:5.08,w:pageSet==='standard'?2.1:2.4,h:.22,fontSize:10,color:'0B3159',align:'center',margin:0});

  const kpiEls=[...document.querySelectorAll('.kpi')].slice(0,8);
  if(kpiEls.length){
    const slide=ppt.addSlide(); slide.background={color:'F5F8FC'};
    slide.addText('Key Performance Indicators',{x:.45,y:.45,w:pageSet==='standard'?8.9:12.3,h:.4,fontSize:24,bold:true,color:'123F72',margin:0});
    slide.addText(scope,{x:.48,y:.9,w:pageSet==='standard'?8.8:12.2,h:.25,fontSize:9.5,color:'52677F',margin:0});
    const cols=pageSet==='standard'?2:4, boxW=pageSet==='standard'?4.25:3.05, boxH=1.05;
    kpiEls.forEach((el,i)=>{
      const x=.55+(i%cols)*(boxW+.18), y=1.35+Math.floor(i/cols)*(boxH+.22);
      const label=el.querySelector('.label')?.textContent||el.querySelector('small')?.textContent||'Metric';
      const val=el.querySelector('.num')?.textContent||el.querySelector('strong')?.textContent||'';
      const sub=el.querySelector('.sub')?.textContent||el.querySelector('em')?.textContent||'';
      slide.addShape(ppt.ShapeType.roundRect,{x,y,w:boxW,h:boxH,rectRadius:.08,fill:{color:'FFFFFF'},line:{color:'C8D7E8'}});
      slide.addText(label,{x:x+.16,y:y+.14,w:boxW-.3,h:.22,fontSize:8.5,bold:true,color:'61738A',margin:0});
      slide.addText(val,{x:x+.16,y:y+.40,w:boxW-.3,h:.35,fontSize:22,bold:true,color:'0B3159',margin:0});
      slide.addText(sub,{x:x+.16,y:y+.78,w:boxW-.3,h:.18,fontSize:7.2,color:'52677F',margin:0});
    });
  }

  if(view==='official'){
    addOfficialFullTableSlide(ppt, officialFiltered(), scope);
    addOfficialDetailSlides(ppt, officialFiltered(), scope);
  }else{
    const chunkSize=pageSet==='standard'?12:14;
    const chunks=[];
    for(let i=0;i<rows.length;i+=chunkSize)chunks.push(rows.slice(i,i+chunkSize));
    (chunks.length?chunks:[[]]).slice(0,8).forEach((chunk,i)=>{
      addPptTable(ppt, chunk, `${viewName}${chunks.length>1?` (${i+1}/${Math.min(chunks.length,8)})`:''}`, scope, pageSet);
    });
  }

  const fileScope=($('janpadFilter')?.value||$('districtFilter')?.value||'ALL').replaceAll(' ','_');
  const pptName=`SRDM_SATNA_${view}_${fileScope}_${todayDate()}.pptx`;
  try{
    const result=ppt.writeFile({fileName:pptName});
    if(result&&typeof result.catch==='function')result.catch(err=>{console.error(err);alert('PPT बनाने में error आया: '+(err?.message||err));});
  }catch(err){
    console.error(err);
    alert('PPT बनाने में error आया: '+(err?.message||err));
  }
}
function initPptExportUI(){
  $('pptBtn')?.addEventListener('click',downloadCurrentPpt);
  $('screenPptBtn')?.addEventListener('click',downloadCurrentPpt);
  document.querySelectorAll('[data-review-view]').forEach(b=>b.addEventListener('click',()=>{
    const v=b.dataset.reviewView;
    document.querySelector(`.tab[data-view="${v}"]`)?.click();
  }));
}

;['sortMetric','sortOrder'].forEach(id=>{const el=$(id);if(el)el.addEventListener('change',render)});

/* ================================================================
   SRDM RECOVERY DONE PATCH - 30-08-2026
   Source: Recovery Done Works matched by Work Code
   ================================================================ */
(function(){
  function recoverySource(){
    const d=$('districtFilter')?.value||'ALL',j=$('janpadFilter')?.value||'ALL',e=$('engineerFilter')?.value||'ALL',c=$('clusterFilter')?.value||'ALL',k=$('categoryFilter')?.value||'ALL';
    return (ongoingDetails||[]).filter(r=>num(r.recoveryWork)>0 &&
      (d==='ALL'||districtOf(r.janpad)===d) && (j==='ALL'||clean(r.janpad)===j) &&
      (e==='ALL'||clean(r.engineer)===e) && (c==='ALL'||clean(r.cluster)===c) &&
      (k==='ALL'||(clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy))===k));
  }
  function recoveryCountForScope(scope){
    let a=recoverySource();
    if(scope.district)a=a.filter(r=>districtOf(r.janpad)===scope.district);
    if(scope.janpad)a=a.filter(r=>clean(r.janpad)===scope.janpad);
    if(scope.engineer)a=a.filter(r=>clean(r.engineer)===scope.engineer);
    if(scope.cluster)a=a.filter(r=>clean(r.cluster)===scope.cluster);
    if(scope.gp)a=a.filter(r=>clean(r.panchayat)===scope.gp);
    if(scope.code)a=a.filter(r=>clean(r.code)===scope.code);
    if(scope.category)a=a.filter(r=>(clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy))===scope.category);
    if(view==='ekbagiya')a=a.filter(r=>['Ek Bagiya','Ek Bagiya Maa Ke Naam'].includes(clean(r.finalCategory)||finalWorkCategory(r.name,r.type,r.fy)));
    return a.length;
  }
  function renderRecoveryDone(){
    const src=recoverySource(); const m=new Map();
    for(const r of src){const key=[clean(r.janpad),clean(r.engineer)||'Unmapped',clean(r.cluster)||'Unmapped'].join('¦');
      if(!m.has(key))m.set(key,{district:districtOf(r.janpad),janpad:r.janpad,engineer:r.engineer||'Unmapped',cluster:r.cluster||'Unmapped',recoveryWork:0,recoveryAmount:0,totalWorks:0});
      const x=m.get(key);x.recoveryWork+=num(r.recoveryWork)||1;x.recoveryAmount+=num(r.recoveryAmount);
    }
    const all=correctedWorkFiltered(); const tm=aggregate(all,['janpad','engineer','cluster'],['workCount']);
    const tmap=new Map(tm.map(x=>[[clean(x.janpad),clean(x.engineer),clean(x.cluster)].join('¦'),num(x.workCount)]));
    let data=[...m.values()]; data.forEach(x=>{x.totalWorks=tmap.get([clean(x.janpad),clean(x.engineer),clean(x.cluster)].join('¦'))||0;x.recoveryPct=x.totalWorks?x.recoveryWork*100/x.totalWorks:0});
    data.sort((a,b)=>num(b.recoveryWork)-num(a.recoveryWork)||clean(a.janpad).localeCompare(clean(b.janpad),'hi')||clean(a.engineer).localeCompare(clean(b.engineer),'hi'));
    lastExport=data;$('viewTitle').textContent='Work Recovery Done — Sub Engineer Wise';
    $('viewMeta').textContent=`${fmt(src.length)} recovery-done works • Work Code matched • Recovery Amount ₹ ${num(sum(src,'recoveryAmount')).toLocaleString('en-IN',{maximumFractionDigits:2})} • ${todayDate()}`;
    let h='<thead><tr><th>District</th><th>Janpad</th><th>Sub Engineer / Upyantri</th><th>Cluster</th><th>Total Ongoing Works</th><th>Recovery Work Count</th><th>Recovery %</th><th>Recovery Amount ₹</th></tr></thead><tbody>';
    for(const r of data)h+=`<tr>${cell(r.district)}${cell(r.janpad)}${cell(r.engineer)}${cell(r.cluster)}${cell(r.totalWorks,true)}${cell(r.recoveryWork,true)}<td>${r.recoveryPct.toFixed(1)}%</td><td>${num(r.recoveryAmount).toLocaleString('en-IN',{maximumFractionDigits:2})}</td></tr>`;
    const tw=sum(data,'totalWorks'),rw=sum(data,'recoveryWork'),ra=sum(data,'recoveryAmount');h+=`<tr class="total-row"><td>TOTAL</td><td></td><td></td><td></td>${cell(tw,true)}${cell(rw,true)}<td>${tw?(rw*100/tw).toFixed(1):'0.0'}%</td><td>${num(ra).toLocaleString('en-IN',{maximumFractionDigits:2})}</td></tr>`;
    if(!data.length)h+='<tr><td colspan="8" class="empty-table">Current filter में Recovery Done Work नहीं मिला।</td></tr>';h+='</tbody>';$('reportTable').innerHTML=h;
  }
  function addRecoveryColumn(){
    if(view==='recovery')return;
    const table=$('reportTable'); if(!table)return;
    const headRows=table.querySelectorAll('thead tr'); if(!headRows.length)return;
    const lastHead=headRows[headRows.length-1]; if([...lastHead.cells].some(c=>/Recovery Work/i.test(c.textContent)))return;
    const th=document.createElement('th');th.textContent='Recovery Work';lastHead.appendChild(th);
    // In multi-row headers, add a standalone top-row group cell too so spans remain understandable.
    if(headRows.length>1){const top=headRows[0];const g=document.createElement('th');g.textContent='Recovery';g.rowSpan=headRows.length;top.appendChild(g);th.remove();}
    const headers=[...lastHead.cells].map(c=>clean(c.textContent));
    function idx(rx){return headers.findIndex(h=>rx.test(h));}
    const iJan=idx(/^Janpad$/i),iEng=idx(/^(Sub Engineer|Engineer|Sub Engineer \/ Upyantri|Engineer \/ Upyantri)$/i),iCl=idx(/^Cluster/i),iGp=idx(/^(GP|Gram Panchayat)$/i),iCode=idx(/^Work Code$/i),iCat=idx(/^Work Category$/i),iDist=idx(/^District$/i);
    const body=[...table.querySelectorAll('tbody tr')];
    for(const tr of body){const td=[...tr.cells]; const total=td.length&&clean(td[0].textContent)==='TOTAL';let n;
      if(total)n=recoverySource().length;else{const scope={};if(iJan>=0&&td[iJan])scope.janpad=clean(td[iJan].textContent);if(iEng>=0&&td[iEng])scope.engineer=clean(td[iEng].textContent);if(iCl>=0&&td[iCl])scope.cluster=clean(td[iCl].textContent);if(iGp>=0&&td[iGp])scope.gp=clean(td[iGp].textContent);if(iCode>=0&&td[iCode])scope.code=clean(td[iCode].textContent);if(iCat>=0&&td[iCat])scope.category=clean(td[iCat].textContent);if(iDist>=0&&td[iDist])scope.district=clean(td[iDist].textContent);n=recoveryCountForScope(scope)}
      const c=document.createElement('td');c.textContent=fmt(n);if(n>0)c.className='bucket-good';tr.appendChild(c);
    }
  }
  const originalRender=render;
  render=function(){if(view==='recovery')return renderRecoveryDone();const x=originalRender();addRecoveryColumn();return x;};
  function installRecoveryTab(){
    if(document.querySelector('.tab[data-view="recovery"]'))return;
    const first=document.querySelector('.tab');if(!first||!first.parentElement)return;
    const b=document.createElement('button');b.className='tab';b.dataset.view='recovery';b.textContent='Work Recovery Done';
    b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');view='recovery';render();document.querySelector('.report-card')?.scrollIntoView({behavior:'smooth',block:'start'});});
    first.parentElement.appendChild(b);
  }
  installRecoveryTab();
  addRecoveryColumn();
})();
/* END SRDM RECOVERY DONE PATCH */
